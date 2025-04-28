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
-- Name: counties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.counties (
    id integer NOT NULL,
    name character varying(55),
    district integer,
    branch integer,
    labor_rate numeric(10,2),
    fringe_rate numeric(10,2),
    market public.market DEFAULT 'LOCAL'::public.market,
    flagging_rate numeric(10,2),
    insurance numeric(10,2),
    fuel numeric(10,2),
    flagging_non_rated_target_gm numeric(10,2),
    flagging_rated_target_gm numeric(10,2),
    flagging_base_rate numeric(10,2),
    flagging_fringe_rate numeric(10,2)
);


ALTER TABLE public.counties OWNER TO postgres;

--
-- Name: counties_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.counties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.counties_id_seq OWNER TO postgres;

--
-- Name: counties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.counties_id_seq OWNED BY public.counties.id;


--
-- Name: counties id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counties ALTER COLUMN id SET DEFAULT nextval('public.counties_id_seq'::regclass);


--
-- Data for Name: counties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.counties (id, name, district, branch, labor_rate, fringe_rate, market, flagging_rate, insurance, fuel, flagging_non_rated_target_gm, flagging_rated_target_gm, flagging_base_rate, flagging_fringe_rate) FROM stdin;
1	Adams	8	3	29.22	19.49	MOBILIZATION	21.00	25.00	30.00	55.00	40.00	25.61	19.49
2	Allegheny	11	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
3	Armstrong	10	3	32.75	25.50	MOBILIZATION	21.00	25.00	30.00	55.00	40.00	31.95	26.00
4	Beaver	11	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
5	Bedford	9	3	32.75	25.50	LOCAL	21.00	25.00	6.00	55.00	35.00	31.95	26.00
6	Berks	5	2	29.22	19.49	LOCAL	21.00	25.00	6.00	55.00	38.00	25.61	19.49
7	Bradford	3	1	29.22	19.49	CORE	21.00	25.00	30.00	55.00	35.00	25.61	19.49
8	Bucks	6	2	39.00	26.99	LOCAL	21.00	25.00	6.00	55.00	38.00	33.60	26.99
9	Butler	10	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
10	Cambria	9	3	32.75	25.50	LOCAL	21.00	25.00	6.00	55.00	35.00	31.95	26.00
11	Cameron	2	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
12	Carbon	5	2	29.22	19.49	CORE	21.00	25.00	15.00	55.00	38.00	25.61	19.49
13	Centre	2	3	32.75	25.50	CORE	21.00	25.00	30.00	55.00	35.00	31.95	26.00
14	Chester	6	2	39.00	26.99	LOCAL	21.00	25.00	6.00	55.00	38.00	33.60	26.99
15	Clarion	10	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
16	Clearfield	2	3	32.75	25.50	CORE	21.00	25.00	30.00	55.00	35.00	31.95	26.00
57	Wayne	4	1	29.22	19.49	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	25.61	19.49
58	Westmoreland	12	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
59	Wyoming	4	1	29.22	19.49	CORE	21.00	25.00	30.00	55.00	35.00	25.61	19.49
60	York	8	2	29.22	19.49	CORE	21.00	25.00	30.00	55.00	35.00	25.61	19.49
17	Crawford	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
18	Cumberland	8	1	29.22	19.49	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	25.61	19.49
19	Dauphin	8	2	29.22	19.49	CORE	21.00	25.00	30.00	55.00	35.00	25.61	19.49
20	Delaware	6	2	39.00	26.99	LOCAL	21.00	25.00	6.00	55.00	38.00	33.60	26.99
21	Elk	2	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
22	Erie	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
23	Fayette	12	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
24	Forest	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
25	Franklin	8	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
26	Fulton	9	3	32.75	25.50	CORE	21.00	25.00	15.00	55.00	35.00	31.95	26.00
27	Huntington	9	3	32.75	25.50	LOCAL	21.00	25.00	6.00	55.00	35.00	31.95	26.00
28	Lackawanna	4	1	29.22	19.49	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	25.61	19.49
29	Lancaster	8	2	29.22	19.49	CORE	21.00	25.00	15.00	55.00	38.00	25.61	19.49
30	Lawrence	11	3	32.75	25.50	MOBILIZATION	21.00	25.00	30.00	55.00	40.00	31.95	26.00
31	Lebanon	8	2	29.22	19.49	CORE	21.00	25.00	15.00	55.00	38.00	25.61	19.49
32	Lehigh	5	2	29.22	19.49	LOCAL	21.00	25.00	6.00	55.00	38.00	25.61	19.49
61	Blair	1	3	32.75	25.50	LOCAL	21.00	25.00	6.00	55.00	35.00	31.95	26.00
62	Clinton	1	1	32.75	25.50	CORE	21.00	25.00	44.00	55.00	35.00	31.95	26.00
67	Columbia	1	1	29.22	19.49	LOCAL	21.00	25.00	6.00	55.00	35.00	25.61	19.49
68	Federal District 6	1	2	39.00	26.99	LOCAL	21.00	25.00	44.00	55.00	38.00	33.60	26.99
63	Greene	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
64	Indiana	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
65	Jefferson	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
66	Juniata	1	1	32.75	25.50	CORE	21.00	25.00	44.00	55.00	35.00	25.61	19.49
33	Luzerene	4	1	29.22	19.49	CORE	21.00	25.00	30.00	55.00	35.00	25.61	19.49
34	Lycoming	3	1	29.22	19.49	CORE	21.00	25.00	15.00	55.00	35.00	25.61	19.49
35	McKean	2	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
36	Mercer	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
37	Mifflin	2	1	32.75	25.50	CORE	21.00	25.00	44.00	55.00	35.00	31.95	26.00
38	Monroe	5	2	29.22	19.49	CORE	21.00	25.00	15.00	55.00	38.00	25.61	19.49
39	Montgomery	6	2	39.00	26.99	LOCAL	21.00	25.00	6.00	55.00	38.00	33.60	26.99
40	Montour	3	1	29.22	19.49	LOCAL	21.00	25.00	6.00	55.00	35.00	25.61	19.49
41	Northhampton	5	2	29.22	19.49	LOCAL	21.00	25.00	6.00	55.00	38.00	25.61	19.49
42	Northumberland	3	1	29.22	19.49	LOCAL	21.00	25.00	6.00	55.00	35.00	25.61	19.49
43	Perry	8	1	29.22	19.49	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	25.61	19.49
44	Philadelphia	6	2	39.00	26.99	LOCAL	21.00	25.00	6.00	55.00	38.00	33.60	26.99
45	Pike	4	1	29.22	19.49	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	25.61	19.49
46	Potter	2	1	32.75	25.50	CORE	21.00	25.00	44.00	55.00	40.00	31.95	26.00
47	Schuylkill	5	2	29.22	19.49	CORE	21.00	25.00	15.00	55.00	38.00	25.61	19.49
48	Snyder	3	1	29.22	19.49	LOCAL	21.00	25.00	6.00	55.00	35.00	25.61	19.49
49	Somerset	9	3	32.75	25.50	CORE	21.00	25.00	15.00	55.00	35.00	31.95	26.00
50	Sullivan	3	1	29.22	19.49	CORE	21.00	25.00	15.00	55.00	35.00	25.61	19.49
51	Susquehanna	4	1	29.22	19.49	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	25.61	19.49
52	Tioga	3	1	29.22	19.49	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	25.61	19.49
53	Union	3	1	29.22	19.49	LOCAL	21.00	25.00	6.00	55.00	35.00	25.61	19.49
54	Venango	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
55	Warren	1	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
56	Washington	12	3	32.75	25.50	MOBILIZATION	21.00	25.00	44.00	55.00	40.00	31.95	26.00
\.


--
-- Name: counties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.counties_id_seq', 68, true);


--
-- Name: counties counties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counties
    ADD CONSTRAINT counties_pkey PRIMARY KEY (id);


--
-- Name: counties fk_branch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counties
    ADD CONSTRAINT fk_branch FOREIGN KEY (branch) REFERENCES public.branches(id);


--
-- Name: TABLE counties; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.counties TO anon;
GRANT ALL ON TABLE public.counties TO authenticated;
GRANT ALL ON TABLE public.counties TO service_role;


--
-- Name: SEQUENCE counties_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.counties_id_seq TO anon;
GRANT ALL ON SEQUENCE public.counties_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.counties_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

