var gulp = require('gulp');
var del = require('del');
var rename = require("gulp-rename");

gulp.task('pack', function () {
    gulp.src(['./theme/angular/**/*']).pipe(gulp.dest('./public/angular'));
    gulp.src(['./theme/landing/**/*']).pipe(gulp.dest('./public/landing'));
});

gulp.task('deploy', function () {
    gulp.src('./public/angular/index.html').pipe(gulp.dest("./views"));
    gulp.src('./public/landing/index.html').pipe(rename('landing.html')).pipe(gulp.dest("./views"));
});

gulp.task('clean', function (next) {
    del(['./public/angular/index.html', './public/landing/tpl/**', './public/landing/index.swig', './public/landing/index.html']);
    next();
});

gulp.task('default', ['pack', 'deploy']);