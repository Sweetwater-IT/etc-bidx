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
-- Name: customer_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.customer_contacts (
    id integer NOT NULL,
    contractor_id integer NOT NULL,
    email character varying(100),
    phone character varying(50),
    created timestamp without time zone DEFAULT now() NOT NULL,
    updated timestamp without time zone,
    name character varying(255),
    role character varying(255)
);


ALTER TABLE public.customer_contacts OWNER TO postgres;

--
-- Name: customer_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_contacts_id_seq OWNER TO postgres;

--
-- Name: customer_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_contacts_id_seq OWNED BY public.customer_contacts.id;


--
-- Name: customer_contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_contacts ALTER COLUMN id SET DEFAULT nextval('public.customer_contacts_id_seq'::regclass);


--
-- Data for Name: customer_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_contacts (id, contractor_id, email, phone, created, updated, name, role) FROM stdin;
12	12	DUNN.NAPOLEON@GMAIL.COM	\N	2025-04-10 13:48:00.755048	\N	NAPOLEON DUNN	ESTIMATOR
13	8	rcover@abcconstructionpa.com 	\N	2025-04-14 15:11:04.740664	\N	Rich Cover	Est.
14	5	scornell@ahcornell.com		2025-04-14 15:14:03.696722	\N	Scott Cornell	Est.
17	235	cshapcott@jdm-inc.com	\N	2025-04-14 18:47:09.164259	\N	 Christopher Shapcott	Site Superintendent 
18	432	dchukinas@road-con.com	(610) 429-8089	2025-04-15 17:06:26.047527	2025-04-15 17:07:18.337	Darby Chukinas	\N
19	236	 jimg@jjaconstruction.com 	(215) 416-7379	2025-04-15 17:15:52.127931	\N	JIM GLOWACKI	Estimating Paving
22	238	kitkauffman@jdeckmaninc.com	(484) 459-5692	2025-04-15 17:25:46.591117	\N	KIT KAUFFMAN	PROJECT MANAGER
20	238	kitkauffman@jdeckmaninc.com	(484) 459-5692	2025-04-15 17:21:54.241215	2025-04-15 17:26:26.153	KIT KAUFFMAN	PROJECT MANAGER
21	238	mzerbe@jdeckmaninc.com		2025-04-15 17:23:56.124214	2025-04-15 17:27:38.079	MATT ZERBE	PROJECT MANAGER
23	3	adrienne.giuliani18@gmail.com	(267) 257-4056	2025-04-18 12:50:47.914637	\N	Adrienne Giuliani	\N
24	13	manager@allentownship.org		2025-04-18 12:56:06.655713	\N	Ilene M. Eckhart	Manager
25	16	kbradley417@hotmail.com	(484) 530-5011	2025-04-18 12:58:45.554677	\N	Kevin Bradley	Estimator
26	16	steve@Almeidahudak.com	(484) 530-5010	2025-04-18 12:59:49.996399	\N	Stephen M Hudak	Owner
\.


--
-- Name: customer_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_contacts_id_seq', 26, true);


--
-- Name: customer_contacts customer_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT customer_contacts_pkey PRIMARY KEY (id);


--
-- Name: customer_contacts customer_contacts_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT customer_contacts_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE;


--
-- Name: TABLE customer_contacts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.customer_contacts TO anon;
GRANT ALL ON TABLE public.customer_contacts TO authenticated;
GRANT ALL ON TABLE public.customer_contacts TO service_role;


--
-- Name: SEQUENCE customer_contacts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.customer_contacts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.customer_contacts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.customer_contacts_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

