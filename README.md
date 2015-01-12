haroo-cloud-web
===============

web site for haroo-cloud

> webservice for haroo* products platform

## Features

- account management
- simple review document view for own account
- trend and featured contents

## Prerequisite
* MongoDB & CouchDB
* Node.js
* NPM
* Bower

## How to run from source

**install dependcy modules**
```bash
$ git clone [this repository]
$ cd haroo-cloud-web
$ npm install
```

**create default configuration files**

```bash
$ npm run configure
```
* create `./config/database.json`
* create `./config/mailer.json`
* create `./config/passport.json`

> update your 

**install ui libraires**

```bash
$ bower install
```

**start**

```bash
$ node app
```

## Service Stack

### backend

- couchdb
- mongodb
- nginx
- node.js
- express.js

### frontend

- jquery
- react.js
- pure
