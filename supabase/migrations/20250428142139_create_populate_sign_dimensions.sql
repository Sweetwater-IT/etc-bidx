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
-- Name: sign_dimensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.sign_dimensions (
    id integer NOT NULL,
    width numeric(10,2),
    height numeric(10,2)
);


ALTER TABLE public.sign_dimensions OWNER TO postgres;

--
-- Name: sign_dimensions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sign_dimensions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sign_dimensions_id_seq OWNER TO postgres;

--
-- Name: sign_dimensions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sign_dimensions_id_seq OWNED BY public.sign_dimensions.id;


--
-- Name: sign_dimensions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_dimensions ALTER COLUMN id SET DEFAULT nextval('public.sign_dimensions_id_seq'::regclass);


--
-- Data for Name: sign_dimensions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sign_dimensions (id, width, height) FROM stdin;
1	84.00	42.00
2	84.00	72.00
3	12.00	18.00
4	108.00	90.00
5	36.00	36.00
6	30.00	10.00
7	78.00	60.00
8	162.00	72.00
9	12.00	36.00
10	24.00	24.00
11	60.00	48.00
12	192.00	108.00
13	18.00	30.00
14	120.00	84.00
15	96.00	66.00
16	24.00	48.00
17	90.00	102.00
18	60.00	12.00
19	48.00	72.00
20	30.00	36.00
21	18.00	36.00
22	12.00	10.00
23	45.00	36.00
24	30.00	30.00
25	78.00	24.00
26	36.00	12.00
27	84.00	78.00
28	9.00	15.00
29	36.00	30.00
30	72.00	48.00
31	144.00	78.00
32	96.00	36.00
33	20.00	6.00
34	48.00	36.00
35	144.00	48.00
36	66.00	36.00
37	30.00	21.00
38	24.00	10.00
39	36.00	48.00
40	90.00	24.00
41	18.00	6.00
42	24.00	4.50
43	24.00	36.00
44	72.00	96.00
45	9.00	12.00
46	120.00	24.00
47	18.00	15.00
48	84.00	48.00
49	96.00	60.00
50	72.00	18.00
51	48.00	18.00
52	12.00	6.00
53	21.00	15.00
54	18.00	18.00
55	144.00	24.00
56	48.00	16.00
57	12.00	9.00
58	12.00	60.00
59	30.00	42.00
60	42.00	60.00
61	48.00	48.00
62	24.00	18.00
63	24.00	6.00
64	72.00	24.00
65	78.00	36.00
66	96.00	30.00
67	30.00	15.00
68	54.00	42.00
69	96.00	96.00
70	12.00	12.00
71	72.00	12.00
72	54.00	18.00
73	102.00	96.00
74	24.00	30.00
75	24.00	8.00
76	36.00	60.00
77	96.00	24.00
78	36.00	8.00
79	48.00	84.00
80	144.00	72.00
81	132.00	60.00
82	72.00	36.00
83	48.00	60.00
84	60.00	36.00
85	288.00	144.00
86	108.00	84.00
87	120.00	48.00
88	60.00	60.00
89	66.00	54.00
90	144.00	42.00
91	132.00	42.00
92	36.00	24.00
93	30.00	18.00
94	42.00	36.00
95	72.00	60.00
96	48.00	9.00
97	36.00	42.00
98	3.00	24.00
99	144.00	60.00
100	12.00	24.00
101	114.00	72.00
102	108.00	54.00
103	78.00	18.00
104	12.00	30.00
105	24.00	12.00
106	78.00	48.00
107	48.00	12.00
108	48.00	30.00
109	10.00	6.00
110	54.00	36.00
111	12.00	48.00
112	13.50	9.00
113	6.00	18.00
114	132.00	36.00
115	72.00	54.00
116	66.00	60.00
117	60.00	18.00
118	60.00	30.00
119	18.00	12.00
120	96.00	48.00
121	36.00	18.00
122	30.00	24.00
123	48.00	8.00
124	78.00	96.00
125	48.00	42.00
126	120.00	60.00
127	120.00	54.00
128	18.00	60.00
129	96.00	72.00
130	102.00	60.00
131	96.00	18.00
132	60.00	24.00
133	27.00	9.00
134	264.00	144.00
135	18.00	24.00
136	48.00	24.00
\.


--
-- Name: sign_dimensions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sign_dimensions_id_seq', 136, true);


--
-- Name: sign_dimensions sign_dimensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_dimensions
    ADD CONSTRAINT sign_dimensions_pkey PRIMARY KEY (id);


--
-- Name: sign_dimensions sign_dimensions_width_height_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_dimensions
    ADD CONSTRAINT sign_dimensions_width_height_key UNIQUE (width, height);


--
-- Name: idx_sign_dimensions_size; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sign_dimensions_size ON public.sign_dimensions USING btree (width, height);


--
-- Name: TABLE sign_dimensions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sign_dimensions TO anon;
GRANT ALL ON TABLE public.sign_dimensions TO authenticated;
GRANT ALL ON TABLE public.sign_dimensions TO service_role;


--
-- Name: SEQUENCE sign_dimensions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.sign_dimensions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.sign_dimensions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.sign_dimensions_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

