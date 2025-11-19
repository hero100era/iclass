\restrict OVCVQfHql0dhyCZX28w1dSvBZgLAMCQqFh58ieqND1t0VbvcL6uW7xJch3L45x0

-- Dumped from database version 18.0 (Debian 18.0-1.pgdg13+3)
-- Dumped by pg_dump version 18.0 (Debian 18.0-1.pgdg13+3)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: api; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA api;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: iclass; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA iclass;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA auth;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: user_profile(text, text); Type: FUNCTION; Schema: api; Owner: -
--

CREATE FUNCTION api.user_profile(email text, pass text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result json;
BEGIN
  SELECT
    row_to_json(r) AS users
  FROM (
    SELECT
      *
    FROM
      auth.user_profile(email, pass)) r INTO result;
  RETURN result;
END;
$$;


--
-- Name: check_role_exists(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.check_role_exists() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NOT EXISTS(
    SELECT
      1
    FROM
      pg_roles AS r
    WHERE
      r.rolname = NEW.role) THEN
  RAISE foreign_key_violation
  USING message = 'unknown database role: ' || NEW.role;
  RETURN NULL;
END IF;
  RETURN new;
END
$$;


--
-- Name: encrypt_pass(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.encrypt_pass() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF tg_op = 'INSERT' OR NEW.pass <> OLD.pass THEN
    NEW.pass = auth.crypt(NEW.pass, auth.gen_salt('bf'));
  END IF;
  RETURN new;
END
$$;


--
-- Name: user_profile(text, text); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.user_profile(email text, pass text) RETURNS TABLE(id integer, role character varying, category character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN query
  SELECT
    u.pk as id,
    u.role,
    u.category
  FROM
    auth.users u
  WHERE
    u.email = user_profile.email
    AND u.pass = auth.crypt(user_profile.pass, u.pass);
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    pk integer NOT NULL,
    email text NOT NULL,
    pass character varying(512) NOT NULL,
    role character varying(64) NOT NULL,
    category character varying(32) NOT NULL,
    is_active boolean DEFAULT true,
    last_active timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_check CHECK ((email ~* '^.+@.+\..+$'::text))
);


--
-- Name: users_pk_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.users_pk_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_pk_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.users_pk_seq OWNED BY auth.users.pk;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: users pk; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users ALTER COLUMN pk SET DEFAULT nextval('auth.users_pk_seq'::regclass);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (pk);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: users encrypt_pass; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER encrypt_pass BEFORE INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION auth.encrypt_pass();


--
-- Name: users ensure_users_role_exists; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE CONSTRAINT TRIGGER ensure_users_role_exists AFTER INSERT OR UPDATE ON auth.users NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION auth.check_role_exists();


--
-- PostgreSQL database dump complete
--

\unrestrict OVCVQfHql0dhyCZX28w1dSvBZgLAMCQqFh58ieqND1t0VbvcL6uW7xJch3L45x0


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20251119020624');
