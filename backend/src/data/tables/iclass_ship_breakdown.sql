-- ============================================================================
-- SHIP SURVEY MANAGEMENT SYSTEM - PostgreSQL Schema
-- ============================================================================
--
-- Domain Overview:
--
-- TEMPLATES LAYER (reusable definitions):
--   breakdown_template          - Template definitions (e.g., "Bulk Carrier Standard")
--   breakdown_template_node     - Hierarchical component definitions within a template
--   breakdown_template_node_particular - Attribute definitions for each component type
--   survey_checklist            - Checklist definitions (e.g., "Annual Survey Checklist")
--   checklist_item      - Individual inspection items within a checklist
--   checklist_item_particular   - Attribute definitions for each checklist item
--
-- SHIP-SPECIFIC LAYER (instantiated from templates, customizable):
--   ships                        - Ship registry
--   ship_breakdown_item        - Actual components on a specific ship
--   ship_breakdown_item_particular - Actual attribute values for ship components
--
-- SURVEY EXECUTION LAYER (created when survey is initiated):
--   ship_survey                 - A survey event for a specific ship
--   survey_line_item          - Copied checklist items for this survey
--   survey_line_item_particular - Copied particulars for surveyor to fill in
--   survey_line_item_breakdown_reading - Per-breakdown-instance readings
--                                        (Feature 7: when checklist item is linked
--                                         to breakdown and ship has multiple instances)
--
-- ============================================================================

-- ┌─────────────────────┐
-- │  breakdown_template  │──────┐
-- └─────────────────────┘      │ 1:N
--                               ▼
--                    ┌──────────────────────┐
--                    │ template_node        │ (hierarchical, self-referencing)
--                    │ (tanks, cargo,       │
--                    │  equipment, systems) │
--                    └──────────────────────┘
--                               │
--                               │ "apply to ship"
--                               ▼
-- ┌─────────┐        ┌──────────────────────┐
-- │  ship    │◄──────►│ ship_breakdown       │ (one active breakdown per ship)
-- └─────────┘  1:1   └──────────────────────┘
--                               │ 1:N
--                               ▼
--                    ┌──────────────────────┐
--                    │ ship_breakdown_node   │ (hierarchical, ship-specific,
--                    │                      │  customizable copy)
--                    └──────────────────────┘
--                               │ 1:N
--                               ▼
--                    ┌──────────────────────┐
--                    │ node_particular      │ (key-value custom properties)
--                    └──────────────────────┘
-- ============================================================
-- 0. EXTENSIONS & ENUMS
-- ============================================================
         -- for materialized path queries (optional but powerful)

-- Component category enum
CREATE TYPE iclass.component_category AS ENUM (
    'HULL_STRUCTURE',
    'TANK',
    'CARGO_SPACE',
    'BALLAST',
    'MACHINERY',
    'PROPULSION',
    'ELECTRICAL',
    'PIPING_SYSTEM',
    'HVAC',
    'SAFETY_EQUIPMENT',
    'NAVIGATION',
    'COMMUNICATION',
    'DECK_EQUIPMENT',
    'ACCOMMODATION',
    'AUXILIARY',
    'OTHER'
);

CREATE TYPE iclass.data_type_enum AS ENUM (
    'text',
    'integer',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'selection',     -- dropdown / single select
    'multi_select'
);

-- Template status
CREATE TYPE iclass.template_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED',
    'DEPRECATED'
);


-- ============================================================
-- 1. TEMPLATE LAYER
-- ============================================================

-- ---------------------------------------------
-- 1.1 Breakdown Template (header)
-- ---------------------------------------------
CREATE TABLE iclass.breakdown_template (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,       -- e.g., 'TMPL-BULK-001'
    name            VARCHAR(200) NOT NULL,               -- e.g., 'Bulk Carrier Standard Breakdown'
    description     TEXT,
    vessel_type     VARCHAR(100),                        -- e.g., 'Bulk Carrier', 'Tanker', 'Container'
    version         VARCHAR(20)      NOT NULL DEFAULT '1.0',
    is_active       BOOLEAN   NOT NULL DEFAULT TRUE,
    -- Versioning / lineage
    parent_template_id UUID REFERENCES iclass.breakdown_template(id),  -- if cloned from another template

    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_template_code_version UNIQUE (code, version)
);

CREATE INDEX idx_template_vessel_type ON iclass.breakdown_template(vessel_type);
CREATE INDEX idx_template_is_active ON iclass.breakdown_template(is_active);

COMMENT ON TABLE iclass.breakdown_template IS
    'Master template defining a reusable ship breakdown structure. Can be versioned.';


-- ---------------------------------------------
-- 1.2 Template Node (hierarchical components)
-- ---------------------------------------------
CREATE TABLE iclass.breakdown_template_node(
    id              SERIAL PRIMARY KEY,
    template_id     integer  NOT NULL REFERENCES iclass.breakdown_template(id) ON DELETE CASCADE,
    parent_node_id  integer  REFERENCES iclass.breakdown_template_node(id) ON DELETE CASCADE,

    -- Identification
    code            VARCHAR(50)  NOT NULL,                -- e.g., 'TK-001', 'ME-001'
    name            VARCHAR(200) NOT NULL,                -- e.g., 'No.1 Port Ballast Tank'
    description     TEXT,

    -- Classification
    category        VARCHAR(100),  -- e.g., 'tank', 'cargo_space', 'equipment', 'system',
    node_type       VARCHAR(50),   -- more granular: 'fuel_oil_tank', 'main_engine', etc.

    -- Hierarchy & ordering
    level           INTEGER      NOT NULL DEFAULT 0,      -- depth in tree (0 = root)
    sort_order      INTEGER      NOT NULL DEFAULT 0,      -- sibling ordering
    is_instantiable     BOOLEAN         NOT NULL DEFAULT TRUE,
    default_quantity    INTEGER         NOT NULL DEFAULT 1,  -- how many to create by default
    path      LTREE,                                 -- materialized path for fast queries
    is_active BOOLEAN  NOT NULL DEFAULT TRUE,

    -- Metadata as JSONB for flexible template properties
    metadata        JSONB        DEFAULT '{}',
    /*  Example metadata:
        {
            "imo_class": "A",
            "medium": "Heavy Fuel Oil",
            "design_pressure": "2.5 bar",
            "location": { "frame_from": 45, "frame_to": 60, "side": "port" }
        }
    */

    is_mandatory     BOOLEAN     NOT NULL DEFAULT TRUE,    -- must this node exist when applied?
    is_leaf          BOOLEAN     NOT NULL DEFAULT FALSE,   -- hint: no children expected

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_template_node_code UNIQUE (template_id, code),
    CONSTRAINT chk_no_self_parent CHECK (id != parent_node_id)
);

CREATE INDEX idx_tnode_template   ON iclass.breakdown_template_node(template_id);
CREATE INDEX idx_tnode_parent     ON iclass.breakdown_template_node(parent_node_id);
CREATE INDEX idx_tnode_category   ON iclass.breakdown_template_node(category);
CREATE INDEX idx_tnode_path       ON iclass.breakdown_template_node USING GIST (path);
CREATE INDEX idx_tnode_metadata   ON iclass.breakdown_template_node USING GIN (metadata);

COMMENT ON TABLE iclass.breakdown_template_node IS
    'Hierarchical tree of components within a breakdown template. Self-referencing for parent-child.';


-- ---------------------------------------------
-- 1.3 Breakdown Template Item Particulars (key-value specs)
-- ---------------------------------------------
CREATE TABLE iclass.breakdown_template_node_particular (
    id              SERIAL PRIMARY KEY,
    template_node_id integer NOT NULL REFERENCES iclass.breakdown_template_node(id) ON DELETE CASCADE,

    attr_key   VARCHAR(20) NOT NULL,               -- e.g., 'material', 'coating_type'
    attr_title VARCHAR(200) NOT NULL,
    data_type   iclass.data_type_enum NOT NULL,         -- TEXT, NUMBER, BOOLEAN, DATE, JSON
    default_value TEXT,                                  -- default value
    selection_options    JSONB,                          -- for selection/multi_select types
                                                          -- e.g., ["good","fair","poor"]
    unit            VARCHAR(20),
    is_required     BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_tnode_attr UNIQUE (template_node_id, attr_key)
);

CREATE INDEX idx_tnattr_node ON iclass.breakdown_template_node_particular(template_node_id);


-- ============================================================
-- 3. SHIP BREAKDOWN LAYER (Template applied to a ship)
-- ============================================================

-- ---------------------------------------------
-- 3.1 Ship Breakdown (header - links ship ↔ template)
-- ---------------------------------------------
CREATE TABLE iclass.ship_breakdown (
    id              serial PRIMARY KEY,
    ship_id         integer   NOT NULL REFERENCES iclass.ship(id) ON DELETE CASCADE,
    source_template_id integer  REFERENCES iclass.breakdown_template(id),  -- which template was used
    name            VARCHAR(200) NOT NULL,                -- e.g., 'MV Pacific Star - Breakdown Rev.3'
    description     TEXT,
    revision        INTEGER      NOT NULL DEFAULT 1,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,   -- only one active breakdown per ship
    applied_at      TIMESTAMPTZ,                           -- when template was applied
    applied_by      VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Ensure only one active breakdown per ship
    CONSTRAINT uq_ship_active_breakdowns UNIQUE (ship_id, is_active)
        -- Note: This only works if is_active is always TRUE/FALSE (no NULLs)
        -- For partial unique, see the index below
);

-- Better approach: partial unique index for single active breakdown per ship
DROP INDEX IF EXISTS uq_ship_one_active;
ALTER TABLE iclass.ship_breakdown DROP CONSTRAINT IF EXISTS uq_ship_active_breakdown;

CREATE UNIQUE INDEX uq_ship_one_active
    ON iclass.ship_breakdown(ship_id)
    WHERE is_active = TRUE;

CREATE INDEX idx_sbd_ship     ON iclass.ship_breakdown(ship_id);
CREATE INDEX idx_sbd_template ON iclass.ship_breakdown(source_template_id);

COMMENT ON TABLE iclass.ship_breakdown IS
    'An instance of a breakdown structure applied to a specific ship. Copied from template, then customizable.';


-- ---------------------------------------------
-- 3.2 Ship Breakdown Node (ship-specific component tree)
-- ---------------------------------------------
CREATE TABLE iclass.ship_breakdown_node (
    id                  serial PRIMARY KEY,
    ship_id             integer  NOT NULL REFERENCES iclass.ship(ship_id) ON DELETE CASCADE,
    ship_breakdown_id   integer  NOT NULL REFERENCES iclass.ship_breakdown(id) ON DELETE CASCADE,
    parent_node_id      integer  REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,

    -- Traceability back to template
    template_node_id integer   REFERENCES iclass.breakdown_template_node(id) ON DELETE SET NULL,

    -- Identification (can be customized per ship)
    code                VARCHAR(50)  NOT NULL,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,

    -- Classification
    category            component_category NOT NULL DEFAULT 'OTHER',
    node_type           VARCHAR(50),

    -- Hierarchy & ordering
    level           INTEGER      NOT NULL DEFAULT 0,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    path            LTREE,

    -- Customization tracking
    is_from_template    BOOLEAN      NOT NULL DEFAULT TRUE,   -- FALSE if added ship-specifically
    is_modified         BOOLEAN      NOT NULL DEFAULT FALSE,  -- TRUE if template values were changed
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,

    -- Flexible properties (ship-specific overrides)
    metadata            JSONB        DEFAULT '{}',
    /*  Example:
        {
            "actual_capacity_m3": 1250.5,
            "last_inspection": "2024-03-15",
            "coating_condition": "good",
            "remarks": "Capacity reduced due to heating coil installation",
            "location": { "frame_from": 45, "frame_to": 60, "side": "port" }
        }
    */

    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ship_node_code UNIQUE (ship_breakdown_id, code),
    CONSTRAINT chk_no_self_parent_ship CHECK (id != parent_node_id)
);

CREATE INDEX idx_sbnode_breakdown  ON iclass.ship_breakdown_node(ship_breakdown_id);
CREATE INDEX idx_sbnode_parent     ON iclass.ship_breakdown_node(parent_node_id);
CREATE INDEX idx_sbnode_source     ON iclass.ship_breakdown_node(template_node_id);
CREATE INDEX idx_sbnode_category   ON iclass.ship_breakdown_node(category);
CREATE INDEX idx_sbnode_status     ON iclass.ship_breakdown_node(is_active);
CREATE INDEX idx_sbnode_path       ON iclass.ship_breakdown_node USING GIST (path);
CREATE INDEX idx_sbnode_metadata   ON iclass.ship_breakdown_node USING GIN (metadata);

COMMENT ON TABLE iclass.ship_breakdown_node IS
    'Ship-specific breakdown tree. Initially copied from template, then customizable per vessel.';


-- ---------------------------------------------
-- 3.3 Ship Node Attributes (ship-specific key-value)
-- ---------------------------------------------
CREATE TABLE iclass.ship_breakdown_node_particular (
    id serial PRIMARY KEY,
    ship_breakdown_node_id integer NOT NULL REFERENCES iclass.ship_breakdown_node(id) ON DELETE CASCADE,

    -- Traceability
    template_particular_id integer REFERENCES iclass.breakdown_template_node_particular(id) ON DELETE SET NULL,

    attr_key           VARCHAR(100) NOT NULL,
    attr_title         VARCHAR(200) NOT NULL,
    attr_value         TEXT,
    selection_options  JSONB,
    data_type          iclass.data_type_enum    DEFAULT 'TEXT',
    unit               VARCHAR(20),
    is_modified        BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order         INTEGER      NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_snode_attr UNIQUE (ship_breakdown_node_id, attr_key)
);

CREATE INDEX idx_snattr_node ON iclass.ship_breakdown_node_particular(ship_breakdown_node_id);


-- ============================================================
-- 4. AUDIT / CHANGE LOG (Optional but recommended)
-- ============================================================

CREATE TABLE iclass.breakdown_change_log (
    id              BIGSERIAL PRIMARY KEY,
    entity_type     VARCHAR(50)  NOT NULL,     -- 'TEMPLATE_NODE', 'SHIP_NODE', 'SHIP_BREAKDOWN'
    entity_id       UUID         NOT NULL,
    ship_id         UUID         REFERENCES iclass.ship(id),
    action          VARCHAR(20)  NOT NULL,     -- 'CREATE', 'UPDATE', 'DELETE', 'APPLY_TEMPLATE'

    old_values      JSONB,
    new_values      JSONB,
    change_reason   TEXT,

    changed_by      VARCHAR(100),
    changed_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_changelog_entity  ON iclass.breakdown_change_log(entity_type, entity_id);
CREATE INDEX idx_changelog_ship    ON iclass.breakdown_change_log(ship_id);
CREATE INDEX idx_changelog_time    ON iclass.breakdown_change_log(changed_at);


-- ============================================================
-- 5. HELPER VIEWS
-- ============================================================

-- View: Full template tree with breadcrumb path
CREATE OR REPLACE VIEW iclass.v_template_tree AS
WITH RECURSIVE tree AS (
    SELECT
        tn.id,
        tn.template_id,
        tn.parent_node_id,
        tn.code,
        tn.name,
        tn.category,
        tn.node_type,
        tn.level,
        tn.sort_order,
        tn.default_capacity,
        tn.unit_of_measure,
        tn.name::TEXT AS breadcrumb,
        ARRAY[tn.id] AS path_ids
    FROM iclass.template_nodes tn
    WHERE tn.parent_node_id IS NULL

    UNION ALL

    SELECT
        child.id,
        child.template_id,
        child.parent_node_id,
        child.code,
        child.name,
        child.category,
        child.node_type,
        child.level,
        child.sort_order,
        child.default_capacity,
        child.unit_of_measure,
        tree.breadcrumb || ' > ' || child.name,
        tree.path_ids || child.id
    FROM iclass.template_node child
    JOIN tree ON child.parent_node_id = tree.id
)
SELECT
    t.*,
    bt.code AS template_code,
    bt.name AS template_name
FROM tree t
JOIN iclass.breakdown_template bt ON bt.id = t.template_id
ORDER BY t.template_id, t.path_ids;


-- View: Full ship breakdown tree
CREATE OR REPLACE VIEW iclass.v_ship_breakdown_tree AS
WITH RECURSIVE tree AS (
    SELECT
        sn.id,
        sn.ship_breakdown_id,
        sn.parent_node_id,
        sn.code,
        sn.name,
        sn.category,
        sn.node_type,
        sn.level,
        sn.sort_order,
        sn.capacity,
        sn.unit_of_measure,
        sn.status,
        sn.is_from_template,
        sn.is_modified,
        sn.metadata,
        sn.name::TEXT AS breadcrumb,
        ARRAY[sn.id] AS path_ids
    FROM iclass.ship_breakdown_node sn
    WHERE sn.parent_node_id IS NULL

    UNION ALL

    SELECT
        child.id,
        child.ship_breakdown_id,
        child.parent_node_id,
        child.code,
        child.name,
        child.category,
        child.node_type,
        child.level,
        child.sort_order,
        child.capacity,
        child.unit_of_measure,
        child.status,
        child.is_from_template,
        child.is_modified,
        child.metadata,
        tree.breadcrumb || ' > ' || child.name,
        tree.path_ids || child.id
    FROM iclass.ship_breakdown_node child
    JOIN tree ON child.parent_node_id = tree.id
)
SELECT
    t.*,
    sb.ship_id,
    s.name AS ship_name,
    s.imo_number
FROM tree t
JOIN iclass.ship_breakdown sb ON sb.id = t.ship_breakdown_id
JOIN iclass.ship s ON s.id = sb.ship_id
ORDER BY t.ship_breakdown_id, t.path_ids;


-- ============================================================
-- 6. KEY FUNCTIONS
-- ============================================================




-- ---------------------------------------------
-- 6.2 Add a ship-specific node (not from template)
-- ---------------------------------------------
