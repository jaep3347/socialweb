-- Table: public.posts

-- DROP TABLE public.posts;

CREATE TABLE public.posts
(
    author character varying(255) COLLATE pg_catalog."default" NOT NULL,
    pid integer NOT NULL DEFAULT nextval('"Posts_pid_seq"'::regclass),
    content text COLLATE pg_catalog."default" NOT NULL,
    time_posted timestamp with time zone NOT NULL,
    CONSTRAINT "Posts_pkey" PRIMARY KEY (pid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.posts
    OWNER to postgres;



-- Table: public.comments

-- DROP TABLE public.comments;

CREATE TABLE public.comments
(
    cid integer NOT NULL DEFAULT nextval('"Comments_cid_seq"'::regclass),
    content text COLLATE pg_catalog."default" NOT NULL,
    author character varying(255) COLLATE pg_catalog."default" NOT NULL,
    time_posted timestamp with time zone NOT NULL,
    pid integer NOT NULL,
    CONSTRAINT "Comments_pkey" PRIMARY KEY (cid),
    CONSTRAINT "Posts_fkey" FOREIGN KEY (pid)
        REFERENCES public.posts (pid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.comments
    OWNER to postgres;