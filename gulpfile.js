var gulp = require('gulp');
var del = require('del');
var rename = require("gulp-rename");

gulp.task('pack', function () {
    gulp.src(['./theme/angular/**/*']).pipe(gulp.dest('./public/angular'));
    gulp.src(['./theme/landing/**/*']).pipe(gulp.dest('./public/landing'));
    gulp.src(['./theme/bower_components/bootstrap/**/*']).pipe(gulp.dest('./public/landing/components/bootstrap'));
    gulp.src(['./theme/bower_components/animate.css/**/*']).pipe(gulp.dest('./public/landing/components/animate.css'));
    gulp.src(['./theme/bower_components/font-awesome/**/*']).pipe(gulp.dest('./public/landing/components/font-awesome'));
    gulp.src(['./theme/bower_components/simple-line-icons/**/*']).pipe(gulp.dest('./public/landing/components/simple-line-icons'));
    gulp.src(['./theme/bower_components/jquery_appear/**/*']).pipe(gulp.dest('./public/landing/components/jquery_appear'));
    gulp.src(['./theme/bower_components/jquery/**/*']).pipe(gulp.dest('./public/landing/components/jquery'));
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