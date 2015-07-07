// GULP PLUGINS
var gulp = require('gulp');
var browserSync = require('browser-sync');
var pngcrush = require('imagemin-pngcrush');
var $ = require('gulp-load-plugins')();


// DIR VARS
var path = './assets/';
var dist_path = './dist/';


// JS HINT - lint scripts
gulp.task('jshint', function(){
  return gulp.src('./assets/scripts/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jshint.reporter('fail'));
});


// SCRIPTS
gulp.task('scripts', function() {
  gulp.src(path + 'scripts/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
      .pipe($.concat('main.js'))
      .pipe(gulp.dest(dist_path))
    .pipe($.sourcemaps.write())
    .pipe($.rename('main.min.js'))
    .pipe($.uglify())
    .pipe(gulp.dest(dist_path));
});


// STYLES (sass)
gulp.task('style_task', function() {
  gulp.src(path + 'styles/main.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
      .pipe($.sass({ errLogToConsole: true }))
      .pipe($.autoprefixer({
        browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
      }))
      .pipe($.rename('styles.css'))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(dist_path))
    .pipe(browserSync.stream())
    .pipe($.minifyCss())
    .pipe($.rename('styles.min.css'))
    .pipe(gulp.dest(dist_path));
});


// IMAGES
gulp.task('image_task', function() {
  return gulp.src(path + 'img/*')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{removeUnknownsAndDefaults: false}],
      use: [pngcrush()]
    }))
    .pipe(gulp.dest(dist_path + 'images'));
});


// BROWSERSYNC
gulp.task('js-watch', ['jshint', 'scripts'], browserSync.reload);


// WATCH TASK
gulp.task('watch', function() {
  browserSync.init({
      proxy: "psy.dev"
  });

  gulp.watch([path + 'styles/**/*'], ['style_task']);
  gulp.watch([path + 'scripts/**/*'], ['js-watch']);
  gulp.watch([path + 'img/**/*'], ['image_task']);
  gulp.watch(['**/*.php', '**/*.html']).on('change', browserSync.reload);
});

