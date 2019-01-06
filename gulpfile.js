'use strict';

const { src, dest, parallel, series } = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const jasmine = require('gulp-jasmine');
const del = require('del');

let destForBuild = 'dist/assets';
let destForDemo = 'demo/assets';
let output

// Build environment
function initBuild(cb) {
  output = destForBuild;
  cb();
}

// Demo environment
function initBuildDemo(cb) {
  output = destForDemo;
  cb();
}

// Scripts
function js() {
  return src('src/scripts/*.js')
    .pipe(dest(output + '/js'));
};

// Libs
function copyLibs() {
  return src('src/libs/*.js')
    .pipe(dest(output + '/js'));
};

function copyLibsAndMinify() {
  return src('src/libs/*.js')
    .pipe(rename(function (path) {
      path.basename += '.min';
    }))
    .pipe(uglify())
    .pipe(dest(output + '/js'));
};

// Styles
function css() {
  return src('src/styles/*.css')
    .pipe(dest(output + '/css'));
};

// HTML
function html() {
  return src('src/html/*.html')
    .pipe(dest('demo'));
};

// Clean
function clean() {
  return del(['dist/*', 'demo/*']);
};

// Tests
function test() {
  return src('tests/utils.js')
    .pipe(jasmine());
};

let buildPipeline = series(initBuild, parallel(js, copyLibsAndMinify), test)
let buildDemoPipeline = series(initBuildDemo, parallel(js, copyLibs, css, html), test)

exports.clean = clean;
exports.build = buildPipeline;
exports.buildDemo = buildDemoPipeline;
exports.test = test;
exports.default = series(clean, buildPipeline);
