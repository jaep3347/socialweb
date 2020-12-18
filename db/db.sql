-- Table: public.users

-- DROP TABLE public.users;

CREATE TABLE public.users
(
    uid integer NOT NULL DEFAULT nextval('credentials_uid_seq'::regclass),
    username character varying COLLATE pg_catalog."default" NOT NULL,
    password character varying COLLATE pg_catalog."default" NOT NULL,
    name character varying COLLATE pg_catalog."default" NOT NULL,
    posts integer NOT NULL,
    comments integer NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (uid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.users
    OWNER to postgres;

-- Table: public.posts

-- DROP TABLE public.posts;

CREATE TABLE public.posts
(
    content text COLLATE pg_catalog."default" NOT NULL,
    time_posted timestamp with time zone NOT NULL,
    pid integer NOT NULL DEFAULT nextval('posts_pid_seq'::regclass),
    uid integer NOT NULL,
    CONSTRAINT posts_pkey PRIMARY KEY (pid),
    CONSTRAINT posts_fkey FOREIGN KEY (uid)
        REFERENCES public.users (uid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
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
    content text COLLATE pg_catalog."default" NOT NULL,
    time_posted timestamp with time zone NOT NULL,
    cid integer NOT NULL DEFAULT nextval('comments_cid_seq'::regclass),
    pid integer NOT NULL,
    uid integer NOT NULL,
    CONSTRAINT comments_cid PRIMARY KEY (cid),
    CONSTRAINT comments_posts_fkey FOREIGN KEY (pid)
        REFERENCES public.posts (pid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT comments_users_fkey FOREIGN KEY (uid)
        REFERENCES public.users (uid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.comments
    OWNER to postgres;

-- Table: public.favorites

-- DROP TABLE public.favorites;

CREATE TABLE public.favorites
(
    uid integer NOT NULL,
    pid integer NOT NULL,
    CONSTRAINT favorites_posts_fkey FOREIGN KEY (pid)
        REFERENCES public.posts (pid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT favorites_users_fkey FOREIGN KEY (uid)
        REFERENCES public.users (uid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.favorites
    OWNER to postgres;

-- Table: public.vector

-- DROP TABLE public.vector;

CREATE TABLE public.vector
(
    uid integer NOT NULL,
    vector json NOT NULL,
    CONSTRAINT vector_pkey PRIMARY KEY (uid),
    CONSTRAINT vector_fkey FOREIGN KEY (uid)
        REFERENCES public.users (uid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.vector
    OWNER to postgres;