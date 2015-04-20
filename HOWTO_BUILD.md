# BUILD PACKAGE 


## Front-end

- copy all theme package to /theme
- follow readme.txt

### Use application theme

- bind static directory to `/theme/angular`

```
## {project root}/theme
grunt build:angular
```

### Use landing theme

- bind static directory to `/theme/landing`

```
## {project root}/theme
grunt build:landing
```

### Copy packages and clean up

- deploy theme files to `/public/angular`, `/public/landing`
- copy index files to `/views`
- clean not needed template file in public folder
- use gulp processor

```
## {project root}
gulp pack
gulp deploy
gulp clean
```

## Back-end