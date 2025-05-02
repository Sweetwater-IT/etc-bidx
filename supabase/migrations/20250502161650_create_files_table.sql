--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.files (
    id integer NOT NULL,
    job_number text,
    filename character varying(255) NOT NULL,
    file_type character varying(50),
    upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    file_size bigint,
    file_data bytea,
    contract_number text
);


ALTER TABLE public.files OWNER TO postgres;

--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.files_id_seq OWNER TO postgres;

--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;


--
-- Name: files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: idx_files_contract_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_files_contract_number ON public.files USING btree (contract_number);


--
-- Name: files files_contract_number_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_contract_number_fkey FOREIGN KEY (contract_number) REFERENCES public.estimates(contract_number) ON DELETE CASCADE;


--
-- Name: files files_job_number_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_job_number_fkey FOREIGN KEY (job_number) REFERENCES public.jobs(job_number) ON DELETE CASCADE;


--
-- Name: TABLE files; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.files TO anon;
GRANT ALL ON TABLE public.files TO authenticated;
GRANT ALL ON TABLE public.files TO service_role;


--
-- Name: SEQUENCE files_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.files_id_seq TO anon;
GRANT ALL ON SEQUENCE public.files_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.files_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

