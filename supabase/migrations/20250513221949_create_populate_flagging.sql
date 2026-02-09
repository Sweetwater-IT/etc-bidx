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
-- Name: flagging; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.flagging (
    id integer NOT NULL,
    fuel_economy_mpg numeric(10,2) NOT NULL,
    truck_dispatch_fee numeric(10,2) NOT NULL,
    worker_comp numeric(10,2) NOT NULL,
    general_liability numeric(10,2) NOT NULL
);


ALTER TABLE public.flagging OWNER TO postgres;

--
-- Name: flagging_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flagging_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flagging_id_seq OWNER TO postgres;

--
-- Name: flagging_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flagging_id_seq OWNED BY public.flagging.id;


--
-- Name: flagging id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flagging ALTER COLUMN id SET DEFAULT nextval('public.flagging_id_seq'::regclass);


--
-- Data for Name: flagging; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flagging (id, fuel_economy_mpg, truck_dispatch_fee, worker_comp, general_liability) FROM stdin;
1	20.00	18.75	4.96	113.55
\.


--
-- Name: flagging_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.flagging_id_seq', 1, true);


--
-- Name: flagging flagging_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flagging
    ADD CONSTRAINT flagging_pkey PRIMARY KEY (id);


--
-- Name: TABLE flagging; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.flagging TO anon;
GRANT ALL ON TABLE public.flagging TO authenticated;
GRANT ALL ON TABLE public.flagging TO service_role;


--
-- Name: SEQUENCE flagging_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.flagging_id_seq TO anon;
GRANT ALL ON SEQUENCE public.flagging_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.flagging_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

