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
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    name character varying(55),
    address character varying(255),
    shop_rate numeric(10,2)
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_id_seq OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, name, address, shop_rate) FROM stdin;
2	Hatfield	3162 Unionville Pk, Hatfield, PA 19440	25.00
3	Bedford	789 Western Ave, Philadelphia, PA 19103	18.00
1	Turbotville	3680 State Rt 54, Turbotville, PA 17772	23.00
\.


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_id_seq', 7, true);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: TABLE branches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.branches TO anon;
GRANT ALL ON TABLE public.branches TO authenticated;
GRANT ALL ON TABLE public.branches TO service_role;


--
-- Name: SEQUENCE branches_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.branches_id_seq TO anon;
GRANT ALL ON SEQUENCE public.branches_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.branches_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

