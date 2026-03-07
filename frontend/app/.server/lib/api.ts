import { getSession } from "./sessions";

const POSTGREST_URL = process.env.POSTGREST_URL || 'http://127.0.0.1:2000';

export async function getDb(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const jwt = session.get("jwt");
  if (!jwt) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return createServerApi(jwt);
}

// ─── PostgREST Filter Operators ──────────────────────────────────────
// Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#operators

export type FilterOperator =
  | `eq.${string}`
  | `neq.${string}`
  | `gt.${string}`
  | `gte.${string}`
  | `lt.${string}`
  | `lte.${string}`
  | `like.${string}`
  | `ilike.${string}`
  | `match.${string}`
  | `imatch.${string}`
  | `in.(${string})`
  | `is.null`
  | `is.true`
  | `is.false`
  | `is.unknown`
  | `isdistinct.${string}`
  | `cs.{${string}}`      // contains (array/range)
  | `cd.{${string}}`      // contained in
  | `ov.{${string}}`      // overlaps
  | `sl.(${string})`      // strictly left of (range)
  | `sr.(${string})`      // strictly right of (range)
  | `nxr.(${string})`     // does not extend right
  | `nxl.(${string})`     // does not extend left
  | `adj.(${string})`     // adjacent (range)
  | `fts.${string}`       // full-text search using to_tsquery
  | `plfts.${string}`     // full-text search using plainto_tsquery
  | `phfts.${string}`     // full-text search using phraseto_tsquery
  | `wfts.${string}`      // full-text search using websearch_to_tsquery
  | `fts(${string}).${string}`    // fts with language config
  | `plfts(${string}).${string}`
  | `phfts(${string}).${string}`
  | `wfts(${string}).${string}`
  | `not.eq.${string}`    // negated operators
  | `not.neq.${string}`
  | `not.gt.${string}`
  | `not.gte.${string}`
  | `not.lt.${string}`
  | `not.lte.${string}`
  | `not.like.${string}`
  | `not.ilike.${string}`
  | `not.in.(${string})`
  | `not.is.null`
  | `not.is.true`
  | `not.is.false`
  | `not.cs.{${string}}`
  | `not.cd.{${string}}`
  | `not.ov.{${string}}`
  | `not.fts.${string}`
  | `not.plfts.${string}`
  | `not.phfts.${string}`
  | `not.wfts.${string}`
  // ─── Operator Modifiers: any / all ───────────────────────────────────
  // Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#operator-modifiers
  // Syntax: operator(any).{val1,val2}  or  operator(all).{val1,val2}
  // any → true if the condition holds for ANY value in the set  (SQL: col = ANY(ARRAY[...]))
  // all → true if the condition holds for ALL values in the set (SQL: col = ALL(ARRAY[...]))
  | `eq(any).{${string}}`
  | `eq(all).{${string}}`
  | `neq(any).{${string}}`
  | `neq(all).{${string}}`
  | `gt(any).{${string}}`
  | `gt(all).{${string}}`
  | `gte(any).{${string}}`
  | `gte(all).{${string}}`
  | `lt(any).{${string}}`
  | `lt(all).{${string}}`
  | `lte(any).{${string}}`
  | `lte(all).{${string}}`
  | `like(any).{${string}}`
  | `like(all).{${string}}`
  | `ilike(any).{${string}}`
  | `ilike(all).{${string}}`
  | `match(any).{${string}}`
  | `match(all).{${string}}`
  | `imatch(any).{${string}}`
  | `imatch(all).{${string}}`
  // Negated modifier variants
  | `not.eq(any).{${string}}`
  | `not.eq(all).{${string}}`
  | `not.neq(any).{${string}}`
  | `not.neq(all).{${string}}`
  | `not.like(any).{${string}}`
  | `not.like(all).{${string}}`
  | `not.ilike(any).{${string}}`
  | `not.ilike(all).{${string}}`
  | `not.match(any).{${string}}`
  | `not.match(all).{${string}}`
  | `not.imatch(any).{${string}}`
  | `not.imatch(all).{${string}}`
  | string; // fallback for complex expressions

// ─── Order Direction ─────────────────────────────────────────────────
// Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#ordering

export type OrderDirection =
  | `${string}.asc`
  | `${string}.desc`
  | `${string}.asc.nullsfirst`
  | `${string}.asc.nullslast`
  | `${string}.desc.nullsfirst`
  | `${string}.desc.nullslast`
  | string;

// ─── Accept Format ──────────────────────────────────────────────────
// Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#response-format

export type AcceptFormat =
  | 'json'
  | 'csv'
  | 'geojson'
  | 'octet-stream'
  | 'single-json'   // application/vnd.pgrst.object+json
  | 'text/plain';   // for scalar RPC results

// ─── Prefer Header Options ──────────────────────────────────────────
// Ref: https://docs.postgrest.org/en/v14/references/api/preferences.html

export interface PreferOptions {
  /**
   * return=representation | return=minimal | return=headers-only
   * Controls what is returned after INSERT/UPDATE/DELETE.
   */
  return?: 'representation' | 'minimal' | 'headers-only';

  /**
   * count=exact | count=planned | count=estimated
   * Controls row count in Content-Range header.
   */
  count?: 'exact' | 'planned' | 'estimated';

  /**
   * resolution=merge-duplicates | resolution=ignore-duplicates
   * For upsert via POST.
   */
  resolution?: 'merge-duplicates' | 'ignore-duplicates';

  /**
   * handling=lenient | handling=strict
   * Controls how PostgREST treats invalid preferences/filters.
   */
  handling?: 'lenient' | 'strict';

  /**
   * params=single-object
   * For RPC: pass the JSON body as a single argument.
   */
  params?: 'single-object' | 'multiple-objects';

  /**
   * tx=commit | tx=rollback
   * Controls transaction behavior (useful for dry-runs with rollback).
   */
  tx?: 'commit' | 'rollback';

  /**
   * max-affected=N
   * Limits the number of rows affected by UPDATE/DELETE.
   * Returns 400 if exceeded.
   */
  maxAffected?: number;

  /**
   * missing=default
   * Use column defaults for missing fields in bulk inserts.
   */
  missing?: 'default';
}

// ─── Request Options ─────────────────────────────────────────────────

export interface ServerApiOptions {
  /**
   * PostgREST select parameter with support for:
   * - Column selection: 'id,title'
   * - Renaming: 'fullName:full_name'
   * - Casting: 'id::text'
   * - JSON/JSONB field access (text): 'data->>key'  (returns the value as text)
   * - JSON/JSONB field access (json): 'data->key'   (returns the value as JSON)
   * - Nested JSON path: 'data->phones->0->>number'
   * - Composite/array fields: 'location->>lat,location->>long,languages->0'
   * - Resource embedding: 'id,title,comments(id,body)'
   * - Spread embedding: 'id,...categories(name)'
   * - Embedding with hints: 'id,title,comments!inner(body)'
   * - Top-level ordering of embedded: 'id,comments(id,body).order(id.desc)'
   *
   * @example
   * // Access JSON sub-fields
   * select: 'id,json_data->>blood_type,json_data->phones'
   * // Nested path
   * select: 'id,json_data->phones->0->>number'
   */
  select?: string;

  /**
   * Ordering columns with direction.
   * Can be string or array of strings.
   * e.g., 'created_at.desc.nullslast' or ['priority.asc', 'created_at.desc']
   *
   * JSON/JSONB column paths are supported as the column name:
   * e.g., 'json_data->>age.desc' or 'json_data->score.asc.nullslast'
   */
  order?: OrderDirection | OrderDirection[];

  /**
   * Limit number of rows returned.
   */
  limit?: number;

  /**
   * Offset for pagination.
   */
  offset?: number;

  /**
   * Range header based pagination (alternative to limit/offset).
   * e.g., [0, 24] for first 25 items.
   */
  range?: [number, number];

  /**
   * Column-level filters.
   * The key is the column name (or JSON path) and the value is a PostgREST filter operator.
   *
   * Plain columns:
   * @example { id: 'eq.5', name: 'ilike.*search*' }
   *
   * JSON/JSONB column paths — use `->>` to compare as text, `->` to compare as JSON:
   * @example { 'json_data->>blood_type': 'eq.A-' }   // text comparison
   * @example { 'json_data->age': 'gt.20' }            // numeric/JSON comparison
   *
   * Tip: use the `filter.jsonPath()` helper to build the key safely:
   * @example filters: { [filter.jsonPath('json_data', 'blood_type', 'text')]: 'eq.A-' }
   */
  filters?: Record<string, FilterOperator>;

  /**
   * Logical OR filter across columns.
   * e.g., '(status.eq.active,status.eq.pending)'
   * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#logical-operators
   */
  or?: string;

  /**
   * Logical AND filter (useful for same-column multiple conditions).
   * e.g., '(age.gte.18,age.lte.65)'
   */
  and?: string;

  /**
   * Negated logical filter.
   * e.g., not.or: '(id.eq.1,id.eq.2)' → not.or=(id.eq.1,id.eq.2)
   */
  not?: {
    or?: string;
    and?: string;
  };

  /**
   * Columns parameter for bulk insert — specifies which columns to insert.
   * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#specifying-columns
   */
  columns?: string;

  /**
   * On-conflict columns for upsert.
   * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#on-conflict
   */
  onConflict?: string;

  /**
   * Request body — object, array of objects, or null.
   */
  body?: Record<string, unknown> | Record<string, unknown>[] | null;

  /**
   * Prefer header options.
   */
  prefer?: PreferOptions;

  /**
   * Response format.
   * Defaults to 'json'.
   */
  accept?: AcceptFormat;

  /**
   * Schema selection.
   * Ref: https://docs.postgrest.org/en/v14/references/api/schemas.html
   */
  schema?: string;

  /**
   * Custom headers to add/override.
   */
  headers?: Record<string, string>;

  /**
   * AbortSignal for request cancellation.
   */
  signal?: AbortSignal;

  /**
   * Whether this is a HEAD request (for count-only queries).
   */
  head?: boolean;
}

// RPC-specific options extending the base options.
export interface RpcOptions extends ServerApiOptions {
  /**
   * If true, use GET method for STABLE/IMMUTABLE functions.
   * Parameters are sent as query params instead of body.
   * Ref: https://docs.postgrest.org/en/v14/references/api/functions.html#function-as-get
   */
  get?: boolean;

  /**
   * If true, expect a scalar (single value) response.
   * Sets Accept: text/plain or application/vnd.pgrst.object+json
   */
  scalar?: boolean;
}

// ─── Response Type ───────────────────────────────────────────────────

export interface ServerApiResponse<T> {
  data: T;
  count?: number;
  status: number;
  headers: Headers;
}

// ─── PostgREST Error ─────────────────────────────────────────────────
// Ref: https://docs.postgrest.org/en/v14/references/errors.html

export class PostgRESTError extends Error {
  public status: number;
  public code: string;
  public details: string | null;
  public hint: string | null;

  constructor(
    message: string,
    status: number,
    code: string = '',
    details: string | null = null,
    hint: string | null = null
  ) {
    super(message);
    this.name = 'PostgRESTError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

// ─── Build Prefer Header ────────────────────────────────────────────

function buildPreferHeader(prefer?: PreferOptions): string | undefined {
  if (!prefer) return undefined;

  const parts: string[] = [];

  if (prefer.return) parts.push(`return=${prefer.return}`);
  if (prefer.count) parts.push(`count=${prefer.count}`);
  if (prefer.resolution) parts.push(`resolution=${prefer.resolution}`);
  if (prefer.handling) parts.push(`handling=${prefer.handling}`);
  if (prefer.params) parts.push(`params=${prefer.params}`);
  if (prefer.tx) parts.push(`tx=${prefer.tx}`);
  if (prefer.maxAffected !== undefined)
    parts.push(`max-affected=${prefer.maxAffected}`);
  if (prefer.missing) parts.push(`missing=${prefer.missing}`);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

// ─── Build Accept Header ────────────────────────────────────────────

function buildAcceptHeader(accept?: AcceptFormat, isSingle?: boolean): string {
  if (isSingle || accept === 'single-json') {
    return 'application/vnd.pgrst.object+json';
  }
  switch (accept) {
    case 'csv':
      return 'text/csv';
    case 'geojson':
      return 'application/geo+json';
    case 'octet-stream':
      return 'application/octet-stream';
    case 'text/plain':
      return 'text/plain';
    case 'json':
    default:
      return 'application/json';
  }
}

// ─── Build URL with Query Parameters ────────────────────────────────

function buildQueryUrl(path: string, options: ServerApiOptions): URL {
  const url = new URL(
    path.startsWith('/') ? path : `/${path}`,
    POSTGREST_URL
  );

  if (options.select) url.searchParams.set('select', options.select);

  if (options.order) {
    const orderStr = Array.isArray(options.order)
      ? options.order.join(',')
      : options.order;
    url.searchParams.set('order', orderStr);
  }

  if (options.limit !== undefined)
    url.searchParams.set('limit', String(options.limit));
  if (options.offset !== undefined)
    url.searchParams.set('offset', String(options.offset));

  // Column-level filters
  if (options.filters) {
    for (const [column, operator] of Object.entries(options.filters)) {
      url.searchParams.set(column, operator);
    }
  }

  // Logical operators
  if (options.or) url.searchParams.set('or', options.or);
  if (options.and) url.searchParams.set('and', options.and);

  // Negated logical operators
  if (options.not?.or) url.searchParams.set('not.or', options.not.or);
  if (options.not?.and) url.searchParams.set('not.and', options.not.and);

  // Columns for bulk insert
  if (options.columns) url.searchParams.set('columns', options.columns);

  // On-conflict for upsert
  if (options.onConflict) url.searchParams.set('on_conflict', options.onConflict);

  return url;
}

// ─── Core Request Function ──────────────────────────────────────────

async function request<T>(
  jwt: string,
  method: string,
  path: string,
  options: ServerApiOptions = {}
): Promise<ServerApiResponse<T>> {
  const url = buildQueryUrl(path, options);

  // Build headers
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  }

  // Content-Type (only for requests with body)
  if (options.body !== undefined && options.body !== null) {
    headers["Content-Type"] = "application/json";
  }

  // Accept header
  headers["Accept"] = buildAcceptHeader(options.accept);


  // Schema selection
  // Ref: https://docs.postgrest.org/en/v14/references/api/schemas.html
  if (options.schema) {
    if (method === 'GET' || method === 'HEAD') {
      headers['Accept-Profile'] = options.schema;
    } else {
      headers['Content-Profile'] = options.schema;
    }
  }

  // Prefer header
  const preferValue = buildPreferHeader(options.prefer);
  if (preferValue) {
    headers['Prefer'] = preferValue;
  }

  // Range header (alternative to limit/offset)
  // Ref: https://docs.postgrest.org/en/v14/references/api/pagination_count.html
  if (options.range) {
    headers['Range'] = `${options.range[0]}-${options.range[1]}`;
    headers['Range-Unit'] = 'items';
  }

  const fetchOptions: RequestInit = {
    method: options.head ? 'HEAD' : method,
    headers,
    signal: options.signal,
  };

  if (
    options.body !== undefined &&
    options.body !== null &&
    method !== 'GET' &&
    method !== 'HEAD'
  ) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  // Error handling
  // Ref: https://docs.postgrest.org/en/v14/references/errors.html
  if (!response.ok) {
    let errorBody: {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    } = {};

    try {
      errorBody = await response.json();
    } catch {
      // Response body might not be JSON (e.g., 502 from reverse proxy)
    }

    throw new PostgRESTError(
      errorBody.message || `PostgREST request failed: ${response.status} ${response.statusText}`,
      response.status,
      errorBody.code || '',
      errorBody.details || null,
      errorBody.hint || null
    );
  }

  // Parse response
  let data: T;

  if (response.status === 204 || options.head) {
    data = null as T;
  } else {
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json') || contentType.includes('application/vnd.pgrst.object+json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = (await response.text()) as T;
    } else {
      // Binary or other — return as-is or as ArrayBuffer
      data = (await response.arrayBuffer()) as T;
    }
  }

  // Parse count from Content-Range header
  // Ref: https://docs.postgrest.org/en/v14/references/api/pagination_count.html
  let count: number | undefined;
  const contentRange = response.headers.get('Content-Range');
  if (contentRange) {
    // Format: "0-24/100" or "*/100" or "0-24/*"
    const match = contentRange.match(/\/(\d+)/);
    if (match) {
      count = parseInt(match[1], 10);
    }
  }

  return {
    data,
    count,
    status: response.status,
    headers: response.headers,
  };
}

// ─── Factory: Create API bound to a JWT ──────────────────────────────

export function createServerApi(jwt: string) {
  return {
    /**
     * GET — Read rows from tables/views.
     * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#read
     *
     * @example
     * // Simple query
     * const { data } = await db.get<Todo[]>('/todos');
     *
     * // With select, filtering, ordering, pagination
     * const { data, count } = await db.get<Todo[]>('/todos', {
     *   select: 'id,title,done,user:users(name)',
     *   filters: { done: 'eq.false', priority: 'gte.3' },
     *   order: ['priority.desc', 'created_at.asc'],
     *   limit: 20,
     *   offset: 40,
     *   prefer: { count: 'exact' },
     * });
     *
     * // With OR logic
     * const { data } = await db.get<Todo[]>('/todos', {
     *   or: '(status.eq.active,status.eq.pending)',
     * });
     *
     * // Full-text search
     * const { data } = await db.get<Article[]>('/articles', {
     *   filters: { body: 'wfts(english).search terms' },
     * });
     *
     * // Resource embedding with inner join
     * const { data } = await db.get<Project[]>('/projects', {
     *   select: 'id,name,tasks!inner(id,title)',
     *   filters: { 'tasks.status': 'eq.active' },
     * });
     *
     * // Spread embedded resource
     * const { data } = await db.get('/directors', {
     *   select: 'id,...films(title,year)',
     * });
     *
     * // Range-based pagination
     * const { data } = await db.get<Todo[]>('/todos', {
     *   range: [0, 24],
     *   prefer: { count: 'exact' },
     * });
     *
     * // JSON/JSONB column — select sub-fields, filter and order by them
     * // Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#json-columns
     * const { data } = await db.get<Person[]>('/people', {
     *   select: 'id,json_data->>blood_type,json_data->phones',
     *   filters: { 'json_data->>blood_type': 'eq.A-' },
     *   order: 'json_data->>age.desc',
     * });
     *
     * // Using the filter.jsonPath() helper for the key:
     * const { data } = await db.get<Person[]>('/people', {
     *   select: 'id,json_data->age',
     *   filters: { [filter.jsonPath('json_data', 'age')]: 'gt.20' },
     *   order: filter.jsonPath('json_data', 'age') + '.asc',
     * });
     */
    get<T>(path: string, options?: ServerApiOptions): Promise<ServerApiResponse<T>> {
      return request<T>(jwt, 'GET', path, options);
    },

    /**
     * GET single row — returns object instead of array.
     * PostgREST returns 406 if query matches 0 or >1 rows.
     * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#singular-or-plural
     *
     * @example
     * const { data } = await db.getOne<Todo>('/todos', {
     *   filters: { id: 'eq.42' },
     * });
     */
    getOne<T>(path: string, options?: ServerApiOptions): Promise<ServerApiResponse<T>> {
      return request<T>(jwt, 'GET', path, {
        ...options,
        accept: 'single-json',
      });
    },

    /**
     * HEAD — Same as GET but returns no body. Useful for count-only queries.
     * Ref: https://docs.postgrest.org/en/v14/references/api/pagination_count.html
     *
     * @example
     * const { count } = await db.head('/todos', {
     *   filters: { done: 'eq.false' },
     *   prefer: { count: 'exact' },
     * });
     */
    head(path: string, options?: ServerApiOptions): Promise<ServerApiResponse<null>> {
      return request<null>(jwt, 'HEAD', path, { ...options, head: true });
    },

    /**
     * POST — Insert row(s).
     * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#insert
     *
     * @example
     * // Single insert
     * const { data } = await db.post<Todo>('/todos', {
     *   body: { title: 'New todo', done: false },
     *   accept: 'single-json',
     *   prefer: { return: 'representation' },
     * });
     *
     * // Bulk insert
     * const { data } = await db.post<Todo[]>('/todos', {
     *   body: [
     *     { title: 'Todo 1', done: false },
     *     { title: 'Todo 2', done: true },
     *   ],
     *   prefer: { return: 'representation' },
     * });
     *
     * // Bulk insert with missing columns defaulted
     * const { data } = await db.post<Todo[]>('/todos', {
     *   body: [
     *     { title: 'A' },
     *     { title: 'B', priority: 5 },
     *   ],
     *   columns: 'title,priority',
     *   prefer: { return: 'representation', missing: 'default' },
     * });
     */
    post<T>(path: string, options?: ServerApiOptions): Promise<ServerApiResponse<T>> {
      return request<T>(jwt, 'POST', path, options);
    },

    /**
     * Upsert — Insert with conflict resolution.
     * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#upsert
     *
     * @example
     * // Merge duplicates (default on primary key)
     * const { data } = await db.upsert<Todo[]>('/todos', {
     *   body: [
     *     { id: 1, title: 'Updated', done: true },
     *     { id: 999, title: 'New', done: false },
     *   ],
     *   prefer: { return: 'representation' },
     * });
     *
     * // Upsert on specific columns
     * const { data } = await db.upsert<Todo[]>('/todos', {
     *   body: [{ title: 'Unique title', done: false }],
     *   onConflict: 'title',
     *   prefer: { return: 'representation' },
     * });
     *
     * // Ignore duplicates
     * await db.upsert('/todos', {
     *   body: [{ id: 1, title: 'ignored if exists' }],
     *   prefer: { resolution: 'ignore-duplicates', return: 'minimal' },
     * });
     */
    upsert<T>(path: string, options?: ServerApiOptions): Promise<ServerApiResponse<T>> {
      return request<T>(jwt, 'POST', path, {
        ...options,
        prefer: {
          resolution: 'merge-duplicates',
          ...options?.prefer,
        },
      });
    },

    /**
     * PUT — Full replacement upsert (all columns required).
     * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#put
     *
     * @example
     * const { data } = await db.put<Todo[]>('/todos', {
     *   filters: { id: 'eq.1' },
     *   body: { id: 1, title: 'Replaced', done: true, created_at: '2024-01-01' },
     *   prefer: { return: 'representation' },
     * });
     */
    put<T>(path: string, options?: ServerApiOptions): Promise<ServerApiResponse<T>> {
      return request<T>(jwt, 'PUT', path, options);
    },

    /**
     * PATCH — Update row(s). Only provided columns are updated.
     * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#update
     *
     * @example
     * // Update single row
     * const { data } = await db.patch<Todo>('/todos', {
     *   filters: { id: 'eq.42' },
     *   body: { done: true },
     *   accept: 'single-json',
     *   prefer: { return: 'representation' },
     * });
     *
     * // Update multiple rows
     * const { data } = await db.patch<Todo[]>('/todos', {
     *   filters: { done: 'eq.false', priority: 'lt.3' },
     *   body: { archived: true },
     *   prefer: { return: 'representation' },
     * });
     *
     * // Limited update (max rows affected)
     * await db.patch('/todos', {
     *   filters: { done: 'eq.false' },
     *   body: { done: true },
     *   order: 'created_at.asc',
     *   limit: 10,
     *   prefer: { return: 'minimal', maxAffected: 10 },
     * });
     *
     * // Dry-run update (transaction rollback)
     * const { data } = await db.patch<Todo[]>('/todos', {
     *   filters: { done: 'eq.false' },
     *   body: { done: true },
     *   prefer: { return: 'representation', tx: 'rollback' },
     * });
     */
    patch<T>(path: string, options?: ServerApiOptions): Promise<ServerApiResponse<T>> {
      return request<T>(jwt, 'PATCH', path, options);
    },

    /**
     * DELETE — Delete row(s).
     * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#delete
     *
     * @example
     * // Delete single row
     * await db.delete('/todos', {
     *   filters: { id: 'eq.42' },
     *   prefer: { return: 'minimal' },
     * });
     *
     * // Delete and return deleted rows
     * const { data } = await db.delete<Todo[]>('/todos', {
     *   filters: { done: 'eq.true' },
     *   prefer: { return: 'representation' },
     * });
     *
     * // Limited delete
     * await db.delete('/todos', {
     *   filters: { archived: 'eq.true' },
     *   order: 'created_at.asc',
     *   limit: 100,
     *   prefer: { return: 'minimal', maxAffected: 100 },
     * });
     */
    delete<T>(path: string, options?: ServerApiOptions): Promise<ServerApiResponse<T>> {
      return request<T>(jwt, 'DELETE', path, options);
    },

    /**
     * RPC — Call a PostgreSQL function.
     * Ref: https://docs.postgrest.org/en/v14/references/api/functions.html
     *
     * @example
     * // POST RPC (default, works for all function volatilities)
     * const { data } = await db.rpc<number>('get_active_count');
     *
     * // RPC with arguments
     * const { data } = await db.rpc<SearchResult[]>('search_todos', {
     *   body: { search_term: 'hello', limit_count: 10 },
     * });
     *
     * // GET RPC (for STABLE/IMMUTABLE functions — cacheable)
     * const { data } = await db.rpc<Config>('get_config', {
     *   get: true,
     *   body: { key: 'theme' }, // sent as query params
     * });
     *
     * // RPC returning scalar value
     * const { data } = await db.rpc<string>('get_setting', {
     *   body: { key: 'site_name' },
     *   scalar: true,
     * });
     *
     * // RPC returning set with filtering/ordering
     * const { data } = await db.rpc<Todo[]>('get_todos_by_status', {
     *   body: { p_status: 'active' },
     *   select: 'id,title',
     *   order: 'created_at.desc',
     *   limit: 20,
     *   prefer: { count: 'exact' },
     * });
     *
     * // RPC with params=single-object
     * const { data } = await db.rpc<Result>('process_payload', {
     *   body: { nested: { complex: 'data' } },
     *   prefer: { params: 'single-object' },
     * });
     */
    rpc<T>(functionName: string, options?: RpcOptions): Promise<ServerApiResponse<T>> {
      const { get: useGet, scalar, body, ...restOptions } = options || {};

      let method = 'POST';
      let rpcOptions: ServerApiOptions = { ...restOptions };

      // GET RPC: parameters passed as query params
      // Ref: https://docs.postgrest.org/en/v14/references/api/functions.html#calling-with-get
      if (useGet && body && typeof body === 'object' && !Array.isArray(body)) {
        method = 'GET';
        const rpcFilters: Record<string, string> = {};
        for (const [key, value] of Object.entries(body)) {
          rpcFilters[key] = String(value);
        }
        rpcOptions.filters = { ...rpcOptions.filters, ...rpcFilters };
      } else {
        rpcOptions.body = body;
      }

      // Scalar return type
      if (scalar) {
        rpcOptions.accept = 'text/plain';
      }

      return request<T>(jwt, method, `/rpc/${functionName}`, rpcOptions);
    },
  };
}

// ─── Convenience: Filter builder ────────────────────────────────────
// Helper for building complex filter expressions programmatically.
// Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#operators

export const filter = {
  eq: (value: string | number | boolean): FilterOperator => `eq.${value}`,
  neq: (value: string | number | boolean): FilterOperator => `neq.${value}`,
  gt: (value: string | number): FilterOperator => `gt.${value}`,
  gte: (value: string | number): FilterOperator => `gte.${value}`,
  lt: (value: string | number): FilterOperator => `lt.${value}`,
  lte: (value: string | number): FilterOperator => `lte.${value}`,
  like: (pattern: string): FilterOperator => `like.${pattern}`,
  ilike: (pattern: string): FilterOperator => `ilike.${pattern}`,
  match: (pattern: string): FilterOperator => `match.${pattern}`,
  imatch: (pattern: string): FilterOperator => `imatch.${pattern}`,
  is: (value: 'null' | 'true' | 'false' | 'unknown'): FilterOperator => `is.${value}`,
  isdistinct: (value: string): FilterOperator => `isdistinct.${value}`,
  in: (values: (string | number)[]): FilterOperator => `in.(${values.join(',')})`,
  cs: (values: (string | number)[]): FilterOperator => `cs.{${values.join(',')}}`,
  cd: (values: (string | number)[]): FilterOperator => `cd.{${values.join(',')}}`,
  ov: (values: (string | number)[]): FilterOperator => `ov.{${values.join(',')}}`,
  sl: (range: string): FilterOperator => `sl.(${range})`,
  sr: (range: string): FilterOperator => `sr.(${range})`,
  nxr: (range: string): FilterOperator => `nxr.(${range})`,
  nxl: (range: string): FilterOperator => `nxl.(${range})`,
  adj: (range: string): FilterOperator => `adj.(${range})`,
  fts: (query: string, config?: string): FilterOperator =>
    config ? `fts(${config}).${query}` : `fts.${query}`,
  plfts: (query: string, config?: string): FilterOperator =>
    config ? `plfts(${config}).${query}` : `plfts.${query}`,
  phfts: (query: string, config?: string): FilterOperator =>
    config ? `phfts(${config}).${query}` : `phfts.${query}`,
  wfts: (query: string, config?: string): FilterOperator =>
    config ? `wfts(${config}).${query}` : `wfts.${query}`,

  /** Negate any operator */
  not: (op: FilterOperator): FilterOperator => `not.${op}`,

  /** Build OR expression for use in `or` parameter */
  or: (...conditions: string[]): string => `(${conditions.join(',')})`,

  /** Build AND expression for use in `and` parameter */
  and: (...conditions: string[]): string => `(${conditions.join(",")})`,

  /**
   * Build a JSON/JSONB column path for use as a filter key, order value, or select expression.
   * Ref: https://docs.postgrest.org/en/v14/references/api/tables_views.html#json-columns
   *
   * @param column  - The base column name (e.g. 'json_data')
   * @param path    - Dot-separated path to the nested key (e.g. 'address.city' or 'age')
   * @param cast    - 'text'  → uses ->> (extracts as text, use for string/text comparisons)
   *                  'json'  → uses ->  (extracts as JSON/native type, use for numeric comparisons)
   *                  Defaults to 'text' (->>).
   *
   * @example
   * // Filter: blood type text comparison
   * filters: { [filter.jsonPath('json_data', 'blood_type')]: 'eq.A-' }
   * // → ?json_data->>blood_type=eq.A-
   *
   * // Filter: numeric age comparison
   * filters: { [filter.jsonPath('json_data', 'age', 'json')]: 'gt.20' }
   * // → ?json_data->age=gt.20
   *
   * // Nested path: phones[0].number
   * filter.jsonPath('json_data', 'phones->0->number', 'text')
   * // → json_data->phones->0->>number
   *
   * // Use in order:
   * order: filter.jsonPath('json_data', 'age') + '.desc'
   * // → json_data->>age.desc
   */
  jsonPath: (column: string, path: string, cast: 'text' | 'json' = 'text'): string => {
    // Split on dots to build arrow chain; last segment uses ->> for text, -> for JSON
    const segments = path.split('.');
    if (segments.length === 1 && !path.includes('->')) {
      // Simple single-key path
      const arrow = cast === 'text' ? '->>' : '->';
      return `${column}${arrow}${path}`;
    }
    // Multi-segment or already arrow-separated: build chain
    // Intermediate segments always use ->, last uses ->> (text) or -> (json)
    const parts = path.split('.');
    const last = parts.pop()!;
    const middle = parts.map(p => `->${p}`).join('');
    const lastArrow = cast === 'text' ? '->>' : '->';
    return `${column}${middle}${lastArrow}${last}`;
  },
} as const;

/**
 * publicApi — Pre-authenticated API client for public endpoints (login, etc).
 */
export const publicApi = createServerApi("");