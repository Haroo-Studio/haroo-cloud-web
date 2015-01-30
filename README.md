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

## External auth for facebook, twitter, google+ etc...

- facebook : https://developers.facebook.com/apps/781367641909033/settings/
- twitter : https://twitter.com/settings/applications
- google+ : https://console.developers.google.com/project/marine-aria-733/apiui/credential

## How to run from source

**install dependency modules**
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

**install ui libraries**

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
