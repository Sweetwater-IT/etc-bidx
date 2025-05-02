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
-- Name: bid_item_numbers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.bid_item_numbers (
    id integer NOT NULL,
    item_number character varying(20),
    description character varying(255),
    uom character varying(20),
    "grouping" text,
    is_custom boolean
);


ALTER TABLE public.bid_item_numbers OWNER TO postgres;

--
-- Name: bid_item_numbers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bid_item_numbers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bid_item_numbers_id_seq OWNER TO postgres;

--
-- Name: bid_item_numbers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bid_item_numbers_id_seq OWNED BY public.bid_item_numbers.id;


--
-- Name: bid_item_numbers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bid_item_numbers ALTER COLUMN id SET DEFAULT nextval('public.bid_item_numbers_id_seq'::regclass);


--
-- Data for Name: bid_item_numbers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bid_item_numbers (id, item_number, description, uom, "grouping", is_custom) FROM stdin;
32	RENTAL	MESSAGE BOARD RENTAL	EA	\N	t
33	09370324	Furnish and Install Flex Delineator post	EA	\N	t
1	0608-0001	Mobilization	L/S	MPT	f
2	0901-0001	Maintenance and Protection of Traffic	L/S	MPT	f
3	0901-0240	Additional Traffic Control Signs	SQ. FT	MPT	f
4	0901-0460	Full-Matrix Changeable Message Sign with Telecommunications	EA	Rental	f
5	0901-0231	Additional Warning Lights, Type B	DAY	MPT	f
6	0975-0001	Remove Post Mounted Signs, Type F	EA	Perm. Signs	f
7	0971-0001	Remove Post Mounted Signs, Type B	EA	Perm. Signs	f
8	0944-0003	Reset Post Mounted Signs, Type E	EA	Perm. Signs	f
10	0931-0001	Post Mounted Signs, Type B	SQ. FT	Perm. Signs	f
11	0901-0461	Full-Matrix Changeable Message Sign without Telecommunications	EA	Rental	f
12	0901-0102	Shadow Vehicle	EA	Rental	f
13	0901-0120	Speed Display	EA	Rental	f
14	0901-0203	Arrow Panel	EA	Rental	f
15	Sale Items	Sale Items	EA	Sale	f
16	Flagging	Flagging	DAY	Flagging	f
18	0935-0001	Post Mounted Signs, Type F	SQ. FT	Perm. Signs	f
19	0941-0001	Reset Post Mounted Signs, Type B	EA	Perm. Signs	f
20	0945-0001	Reset Post Mounted Signs, Type F	EA	Perm. Signs	f
21	0958-0081	Temporary Traffic Control Signals, Trailer-Mounted Portable Device	EA	Rental	f
22	0958-0261	Temporary Traffic Control Signals, Trailer-Mounted Portable Device, Reset	EA	Rental	f
23	0901-0240	Additional Warning Lights, Type C	DAY	MPT	f
24	0936-0200	Structure Mounted Flat Sheet Aluminum Signs	SQ. FT	Perm. Signs	f
34	0937-0320	Flexible Delineator Post GM-1, White	EA	\N	t
35	Coring	Core Drilling	ea	\N	t
36	0901-0003	Maintenance and Protection of Traffic	LS	\N	t
37	0901-0004	Maintenance and Protection of Traffic	LS	\N	t
38	0901-0005	Maintenance and Protection of Traffic	LS	\N	t
39	0901-0006	Maintenance and Protection of Traffic	LS	\N	t
40	0608-0002	Mobilization for 0901-0004	LS	\N	t
41	0608-003	Mobilization for 0901-0005	LS	\N	t
42	0608-004	Mobilization for 0901-0006	LS	\N	t
43	0608-001	Mobilization for 0901-0003	LS	\N	t
44	0901-0240	Additional Traffic Control Signs	SF	\N	t
45	0971-001	Remove Post Mounted Signs, Type B	EA	\N	t
46	9000-0100	POST MOUNTED SIGNS, TYPE B, STEEL SQUARE POST, RESET SIGNS	EA	\N	t
\.


--
-- Name: bid_item_numbers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bid_item_numbers_id_seq', 46, true);


--
-- Name: bid_item_numbers bid_item_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bid_item_numbers
    ADD CONSTRAINT bid_item_numbers_pkey PRIMARY KEY (id);


--
-- Name: TABLE bid_item_numbers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bid_item_numbers TO anon;
GRANT ALL ON TABLE public.bid_item_numbers TO authenticated;
GRANT ALL ON TABLE public.bid_item_numbers TO service_role;


--
-- Name: SEQUENCE bid_item_numbers_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.bid_item_numbers_id_seq TO anon;
GRANT ALL ON SEQUENCE public.bid_item_numbers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.bid_item_numbers_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

