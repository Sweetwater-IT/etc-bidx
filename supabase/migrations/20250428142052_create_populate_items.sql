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
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id integer NOT NULL,
    name character varying(55),
    price numeric(10,2),
    depreciation_rate_useful_life integer,
    last_updated character varying(55) DEFAULT CURRENT_TIMESTAMP,
    payback_period integer
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, name, price, depreciation_rate_useful_life, last_updated, payback_period) FROM stdin;
25	Anti-Theft Bolts	6.00	\N	2024-11-15 02:39:12.407287	\N
26	Chevron Bracket	46.00	\N	2024-11-15 02:39:12.407287	\N
27	Street Name Cross Bracket	10.50	\N	2024-11-15 02:39:12.407287	\N
28	Bullseye Buckles	3.00	\N	2024-11-15 02:39:12.407287	\N
18	S.TRAILER	6850.00	5	2025-01-17T15:30:17.658Z	\N
3	Stripe Board 4ft	9.94	\N	2025-01-17T16:43:00.497Z	\N
22	Perm. Sign Bolts	6.00	\N	2025-01-28T21:31:58.599Z	\N
4	Stripe Board 6ft	14.65	\N	2024-11-15 02:39:12.407287	\N
32	H Stands	60.33	10	2024-11-15 02:45:06.198921	4
6	Sign Hardware	5.00	\N	2024-12-29T14:23:49.119Z	\N
9	4' Ft Type III	150.98	10	2025-01-02T18:27:44.315Z	4
19	HI Signs	6.00	3	2024-11-15 02:39:12.407287	2
21	Special Signs	6.81	3	2024-11-15 02:39:12.407287	2
7	Covers	48.00	3	2024-12-30T03:45:03.173Z	2
8	SL Metal Stands	134.95	3	2024-12-30T04:31:37.249Z	2
12	Type XI Vertical Panels	86.48	5	2024-12-30T04:31:39.250Z	\N
13	B-Lites	113.00	3	2024-12-30T04:31:45.439Z	\N
14	A/C-Lites	17.95	3	2024-12-30T04:31:47.140Z	\N
20	DG Signs	6.81	3	2025-01-02T18:14:00.335Z	2
1	10ft SQ TUBE	25.33	\N	2024-12-30T12:17:02.742Z	\N
5	Sand Bag	2.62	2	2024-11-15 02:39:12.407287	1
33	12ft Posts	30.40	7	2025-02-07T15:21:16.314Z	4
11	HI Vertical Panels	66.18	5	2025-01-07T15:09:40.624Z	\N
15	TMA	158752.92	7	2025-01-07T15:10:35.763Z	\N
24	Posts 12ft	30.40	7	2025-02-07T15:24:52.265Z	4
16	A.BOARD	4195.84	5	2025-01-17T15:12:36.769Z	\N
10	6' Ft Type III	162.00	10	2025-01-17T15:16:01.608Z	\N
17	M.BOARD	17699.99	5	2025-01-17T15:20:55.695Z	\N
35	6 Ft Wings	129.64	10	2025-03-16 22:15:50.527087+00	4
36	Sharps	174.37	5	2025-04-21 16:43:36.19741+00	\N
\.


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 36, true);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: TABLE items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.items TO anon;
GRANT ALL ON TABLE public.items TO authenticated;
GRANT ALL ON TABLE public.items TO service_role;


--
-- Name: SEQUENCE items_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.items_id_seq TO anon;
GRANT ALL ON SEQUENCE public.items_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.items_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

