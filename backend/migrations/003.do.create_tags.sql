CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  instance_id INTEGER,
  name TEXT NOT NULL,
  date_created TIMESTAMP DEFAULT now() NOT NULL,
  date_modified TIMESTAMP DEFAULT now() NOT NULL,
  CONSTRAINT fk_instance
    FOREIGN KEY(instance_id)
      REFERENCES instances(id)
);