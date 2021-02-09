# Einavigointiin.fi

## WIP

### Setup:

With `psql -U postgres` or `sudo -u postgres psql`
```
CREATE DATABASE einavigointiinfi;
CREATE USER einavigointiinfi;
ALTER USER einavigointiinfi WITH PASSWORD 'einavigointiinfi';

\c einavigointiinfi
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO einavigointiinfi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO einavigointiinfi;
```

With `psql -U einavigointiinfi --password einavigointiinfi`:

```


```


## Run

```
npm run start-server
```

```
npm run start
```
