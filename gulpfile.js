'use strict';

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var jasmine = require('gulp-jasmine');
var del = require('del');

var dest;
var destForBuild = 'dist/assets';
var destForDemo = 'demo/assets';

// Build environment
gulp.task('init-build', function () {
  dest = destForBuild;
});

// Demo environment
gulp.task('init-demo', function () {
  dest = destForDemo;
});

// Scripts
gulp.task('scripts', function () {
  return gulp.src('src/scripts/*.js')
    .pipe(gulp.dest(dest + '/js'));
});

// Libs
gulp.task('copy-libs', function () {
  return gulp.src('src/libs/*.js')
    .pipe(gulp.dest(dest + '/js'));
});

gulp.task('copy-libs-and-minify', function () {
  return gulp.src('src/libs/*.js')
    .pipe(rename(function (path) {
      path.basename += '.min';
    }))
    .pipe(uglify())
    .pipe(gulp.dest(dest + '/js'));
});

// Styles
gulp.task('styles', function () {
  return gulp.src('src/styles/*.css')
    .pipe(gulp.dest(dest + '/css'));
});

// HTML
gulp.task('html', function () {
  return gulp.src('src/html/*.html')
    .pipe(gulp.dest('demo'));
});

// Clean
gulp.task('clean', function () {
  del(['dist/*', 'demo/*']);
});

// Tests
gulp.task('test', function () {
  return gulp.src('tests/utils.js')
    .pipe(jasmine());
});

// Build
gulp.task('build', ['init-build', 'test', 'scripts', 'copy-libs-and-minify']);

// Demo
gulp.task('demo', ['init-demo', 'test', 'scripts', 'copy-libs', 'styles', 'html']);

// Default task
gulp.task('default', ['clean', 'build']);
