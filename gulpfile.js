var gulp = require('gulp'),
    // karma for gulp
    // karma = require('karma').server,
    // Concatenates and registers AngularJS templates in the $templateCache.
    templates = require('gulp-angular-templatecache'),
    // A gulp plugin for removing files and folders with support for multiple files & globs.
    del = require('del'),
    // Concatenates files
    concat = require('gulp-concat'),
    // Minifies files
    uglify = require('gulp-uglify'),
    // Renames files
    rename = require('gulp-rename'),
    // Add angularjs dependency injection annotations with ng-annotate
    ngAnnotate = require('gulp-ng-annotate'),
    // Gulp compiler for coffee
    coffee = require('gulp-coffee'),
    // Utility functions for gulp plugins
    gutil = require('gulp-util'),
    // Source map support for Gulp.js
    sourcemaps = require('gulp-sourcemaps'),
    // Append or Prepend a string with gulp
    insert = require('gulp-insert'),
    // Strip-comments from code. Removes both line comments and/or block comments.
    strip = require('gulp-strip-comments'),
    // Compile less to css.
    less = require('gulp-less'),
    inject = require('gulp-inject'),
    path = require('path'),
    // minify css
    minifyCss = require('gulp-minify-css'),
    // Minify PNG, JPEG, GIF and SVG images
    imagemin = require('gulp-imagemin'),
    pkg = require('./package.json');


/* ************************************ */
/* TODO: Testing Tasks                  */
/* ************************************ */
// // Run test once and exit
// gulp.task('test', function (done) {
//   karma.start({
//     configFile: __dirname + '/karma-src.conf.js',
//     singleRun: true
//   }, done);
// });

// gulp.task('test-debug', function (done) {
//   karma.start({
//     configFile: __dirname + '/karma-src.conf.js',
//     singleRun: false,
//     autoWatch: true
//   }, done);
// });

// // Run test once and exit
// gulp.task('test-dist-concatenated', function (done) {
//   karma.start({
//     configFile: __dirname + '/karma-dist-concatenated.conf.js',
//     singleRun: true
//   }, done);
// });

// // Run test once and exit
// gulp.task('test-dist-minified', function (done) {
//   karma.start({
//     configFile: __dirname + '/karma-dist-minified.conf.js',
//     singleRun: true
//   }, done);
// });

/* ************************************ */
/* Template Caching Tasks               */
/* ************************************ */
var templateFiles = ['src/impac-angular/components/**/*.html'];
// builds html templates into angular $templateCache setters in a new module's .run() function.
gulp.task('templates', function () {
  return gulp.src(templateFiles)
    .pipe(templates('tmp/templates/templates.tmp', {
      standalone: true, // creates a new module
      module: 'impac.components.templates', // module name
      // Shorten component $templaceCache paths for simpler dynamic selection, and
      // cleaner includes.
      transformUrl: function (url) {
            // parent component e.g dashboard, widgets.
        var parentFolderName  = url.split('/').splice(0, 1),
            // component's template name.
            fileName          = url.split('/').splice(-1, 1);

        // if html file is a modal, return full path for semantic purposes.
        if (fileName[0].indexOf('.modal.') >= 0) {
          return url;
        }
        // e.g widgets/accounts-balance
        return parentFolderName + '/' + fileName;
      }
    }))
    .pipe(gulp.dest('.'));
});

// makes a copy of impac-angular.modules.js and concatinates templates.tmp into it.
gulp.task('templates:concat', ['templates'], function () {
  return gulp.src(['src/impac-angular/impac-angular.module.js', 'tmp/templates/templates.tmp'])
    .pipe(concat(pkg.name + '.js')) // output filename
    .pipe(gulp.dest('tmp/')); // output destination
});

/* ************************************ */
/* Build Tasks                          */
/* ************************************ */
    // Source files for final dist build
var buildSourceFiles = [
      'src/impac-angular/impac-angular.prefix',
      'tmp/impac-angular.js',
      'src/impac-angular/impac-angular.suffix',
      'tmp/scripts/**/*.js'
    ],
    // CoffeeScript & Less file directories to be compiled before build.
    coffeeFiles = [
      'src/impac-angular/services/**/*.coffee',
      'src/impac-angular/filters/**/*.coffee',
      'src/impac-angular/components/**/*.coffee'
    ],
    lessFiles = [
      'src/impac-angular/components/**/*.less',
      'src/impac-angular/components/**/**/*.less'
    ],
    mainLessFile = 'src/impac-angular/stylesheets/import.less';

// TODO::gulp-sourcemaps: stack trace and debugger not working in browser console.
// TODO::gulp-coffee: is stripping comments on compile, cant find options or
// alternative.
gulp.task('coffee', ['clean'], function () {
  return gulp.src(coffeeFiles)
    .pipe(coffee({bare: true}).on('error', gutil.log))
    // encapsulates components
    .pipe(insert.wrap('(function () {\n\'use strict\';\n', '}).call(this);'))
    // Removes the prefixed extension from files names e.g name.directive.coffee.
    .pipe(rename(function (path) {
      path.basename = path.basename.split('.')[0];
    }))
    .pipe(gulp.dest('tmp/scripts'));
});

// Dynamically injects @import's into the main .less file, allowing less files to be places
// around the app structure with the component page they apply to.
gulp.task('less:inject', function() {
    return gulp.src(mainLessFile)
      .pipe(inject(gulp.src(lessFiles, {
        read: false,
      }), {
        starttag: '/* inject:imports */',
        endtag: '/* endinject */',
        transform: function (filepath) {
          return '@import ".' + filepath + '";';
        }
      }))
      .pipe(gulp.dest('src/impac-angular/stylesheets'));
});

gulp.task('less', ['less:inject'], function () {
  return gulp.src(mainLessFile)
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(rename(function (path) {
      path.basename = 'impac-angular';
    }))
    .pipe(gulp.dest('dist'))
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(rename(function (path) {
      path.basename = 'impac-angular';
      path.basename += '.min';
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['coffee', 'less', 'templates:concat'], function () {
  var stream = gulp.src(buildSourceFiles)
    .pipe(concat('impac-angular.js'))
    .pipe(ngAnnotate())
    .pipe(gulp.dest('dist/'))
    .pipe(uglify())
    .pipe(strip())
    .pipe(rename('impac-angular.min.js'))
    .pipe(gulp.dest('dist/'));

  stream.on('end', function () {
    del(['tmp']);
  });
});

// cleans up tmp file created by 'templates' task.
gulp.task('clean', function (asyncCallback) {
  del(['tmp', './src/impac-angular/impac-angular.js'], asyncCallback);
});

gulp.task('watch', ['build'], function () {
  gulp.watch(['src/**/*.js', 'src/**/*.html', 'src/**/*.less'], ['build']);
});

/* ************************************ */
/* Commands                             */
/* ************************************ */
gulp.task('start:watch', ['watch']);
gulp.task('build:dist', ['build']);
gulp.task('build:less', ['less']);
gulp.task('build:less:inject', ['less:inject']);
gulp.task('build:coffee', ['coffee']);
gulp.task('build:templates', ['templates:concat']);

