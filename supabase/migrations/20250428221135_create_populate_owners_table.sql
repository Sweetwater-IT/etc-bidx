--
-- Name: owners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

ALTER TABLE public.owners OWNER TO postgres;

--
-- Data for Name: owners; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.owners (name) VALUES ('PENNDOT');
INSERT INTO public.owners (name) VALUES ('TURNPIKE');
INSERT INTO public.owners (name) VALUES ('PRIVATE');
INSERT INTO public.owners (name) VALUES ('SEPTA');
INSERT INTO public.owners (name) VALUES ('OTHER');

--
-- Name: TABLE owners; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.owners TO anon;
GRANT ALL ON TABLE public.owners TO authenticated;
GRANT ALL ON TABLE public.owners TO service_role;

--
-- Name: SEQUENCE owners_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.owners_id_seq TO anon;
GRANT ALL ON SEQUENCE public.owners_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.owners_id_seq TO service_role;