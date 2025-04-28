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
-- Name: estimate_mpt_rental; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estimate_mpt_rental (
    id integer NOT NULL,
    estimate_id integer,
    target_moic integer,
    payback_period integer,
    annual_utilization numeric(5,2),
    dispatch_fee numeric(10,2),
    mpg_per_truck numeric(10,2),
    revenue numeric(12,2),
    cost numeric(12,2),
    gross_profit numeric(12,2),
    hours numeric(10,2),
    static_equipment_info jsonb
);


ALTER TABLE public.estimate_mpt_rental OWNER TO postgres;

--
-- Name: estimate_mpt_rental_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.estimate_mpt_rental_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estimate_mpt_rental_id_seq OWNER TO postgres;

--
-- Name: estimate_mpt_rental_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estimate_mpt_rental_id_seq OWNED BY public.estimate_mpt_rental.id;


--
-- Name: estimate_mpt_rental id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estimate_mpt_rental ALTER COLUMN id SET DEFAULT nextval('public.estimate_mpt_rental_id_seq'::regclass);


--
-- Name: estimate_mpt_rental estimate_mpt_rental_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estimate_mpt_rental
    ADD CONSTRAINT estimate_mpt_rental_pkey PRIMARY KEY (id);


--
-- Name: estimate_mpt_rental unique_estimate_mpt_rental; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estimate_mpt_rental
    ADD CONSTRAINT unique_estimate_mpt_rental UNIQUE (estimate_id);


--
-- Name: idx_estimate_mpt_rental; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estimate_mpt_rental ON public.estimate_mpt_rental USING btree (estimate_id);


--
-- Name: estimate_mpt_rental estimate_mpt_rental_estimate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estimate_mpt_rental
    ADD CONSTRAINT estimate_mpt_rental_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE;



--
-- Name: TABLE estimate_mpt_rental; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.estimate_mpt_rental TO anon;
GRANT ALL ON TABLE public.estimate_mpt_rental TO authenticated;
GRANT ALL ON TABLE public.estimate_mpt_rental TO service_role;


--
-- Name: SEQUENCE estimate_mpt_rental_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.estimate_mpt_rental_id_seq TO anon;
GRANT ALL ON SEQUENCE public.estimate_mpt_rental_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.estimate_mpt_rental_id_seq TO service_role;


--
-- PostgreSQL database dump complete
--

