var gulp = require('gulp'),
    path = require('path'),
    del = require('del'),
    ejs = require('gulp-ejs'),
    ejshelper = require('xfs-ejs-helper'),
    uglify = require('gulp-uglify'),
    plumber = require('gulp-plumber'),
    gulpif = require('gulp-if'),
    bs = require('browser-sync').create(),
    lazyImageCSS = require('gulp-lazyimagecss'),
    postcss = require('gulp-postcss'),
    postcssPxtorem = require('postcss-pxtorem'),
    postcssAutoprefixer = require('autoprefixer'),
    posthtml = require('gulp-posthtml'),
    sass = require('gulp-sass'),
    posthtmlPx2rem = require('posthtml-px2rem'),
    RevAll = require('gulp-rev-all'),
    revDel = require('gulp-rev-delete-original'),
    usemin = require('gulp-usemin'),
    minifyCSS = require('gulp-cssnano'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    tmtsprite = require('gulp-tmtsprite'),
    // vx = require("postcss-px-to-viewport"),
    filter = require('gulp-filter'),
    px2rem = require('gulp-px3rem'),
    proxyMiddleware = require('http-proxy-middleware'),
    // seajsCombo = require('gulp-seajs-combo'),
    babel = require('gulp-babel');
    var htmltpl = require('gulp-html-tpl');     // 引用html模板
    var artTemplate = require('art-template');  // 模板渲染
    var paths = {
        'src': {
            'dir': './src/',
            'img': './src/**/*.{JPG,jpg,png,gif,svg}',
            'slice': './src/**/slice/**/*.png',
            'sass': './src/**/*.scss',
            // 'sass': './src/css/style-*.scss',
            'css': './src/**/*.css',
            'js': ['./src/**/*.js','!./src/js/lib/**/*.js'],
            'media': ['./src/**/media/**/*', './src/**/fonts/**/*', './src/**/*.htc'],
            'html': ['./src/**/*.html', '!./src/_*/**/*.html'],
        },
        'dist': {
            'dir': './dist/',
            'img': './dist/assets/img/',
            'css': './dist/assets/css/',
            'js': './dist/assets/js/',
            'sprite': './dist/assets/sprite',
            'html': './dist/'
        }
    },
       /**
    proxy配置，target为需要代理的域名接口地址;可以配置多条规则;
    请求本地站点的/cooperation/* 将自动转发到http://192.168.2.187:70/cooperation/*
    可以用数组设置多个转发规则
     [proxyMiddleware(['/cooperation'], {target: 'http://192.168.2.187:70', changeOrigin: true}),
        proxyMiddleware(['/hr'], {target: 'http://192.168.2.187:70', changeOrigin: true})
     ]
     */
    
    //请求本地站点的/cooperation/* 将自动转发到http://192.168.2.187:70/cooperation/*
    proxy = [
        // proxyMiddleware(['/ac' ], {target: 'http://dev-wap.xinfushe.cn', changeOrigin: true}) , 
        //proxyMiddleware(['/mc' ], {target: 'http://dev-wap.xinfushe.cn', changeOrigin: true}) , 
        // proxyMiddleware(['/mdnLogin'], {target: 'http://dev-wap.xinfushe.cn', changeOrigin: true}) ,
    ],
    config = {
        livereload: true,
        reversion: true,
        seajs: true,
        supportREM:false,
        lazyDir: ['../slice']
    },
    lazyDir = config.lazyDir || ['../slice'],
    serverConfig = {
        baseDir: paths.dist.html,
        middleware: proxy
    },
    postcssOption = [];
    
// 复制操作
var copyHandler = function(type, file) {
    file = file || paths['src'][type];

    return gulp.src(file, { base: paths.src.dir })
        .pipe(gulp.dest('./dist/'))
        .on('end', reloadHandler);
};

// 自动刷新
var reloadHandler = function() {
    config.livereload && bs.reload();
};

// 清除 dist 目录
function delDist() {
    return del([paths.dist.dir]);
}
// 复制文件操作
function copyMedia() {
    return copyHandler('media');
}

/**
 * [compileSass 编译sass及合并Sprite]
 * @return {[type]} [description]
 */
function compileSass() {
    // 需要配置的参数

    return gulp.src('src/**/*.scss')
        .pipe(plumber())
        .pipe(sass())
        .pipe(px2rem({
            path:'',
            baseDpr: 2,             // base device pixel ratio (default: 2)
            threeVersion: false,    // whether to generate @1x, @2x and @3x version (default: false)
            remVersion: true,       // whether to generate rem version (default: true)
            remUnit: 75,            // rem unit value (default: 75)
            remPrecision: 6         // rem precision (default: 6)
          }))
        // .pipe(postcss(processors))
        .pipe(gulp.dest('dist/'))
        .on('end', reloadHandler);
}
/**
 * [compileAutoprefixer 自动补全]
 * @return {[type]} [description]
 */
function compileAutoprefixer(cb, file) {
    var destTarget = file ? path.dirname(file).replace('src', 'dist') : paths.dist.dir;
    return gulp.src(file || './dist/**/*.css')
        .pipe(plumber())
        .pipe(postcss(postcssOption))
        .pipe(gulp.dest(destTarget)).on('end', reloadHandler);
}
/**
 * [miniCSS CSS压缩]
 * @return {[type]} [description]
 */
function miniCSS(cb, file) {
    var destTarget = file ? path.dirname(file).replace('src', 'dist') : paths.dist.dir;
    return gulp.src(file || './src/**/*.css')
        .pipe(plumber())
        .pipe(minifyCSS({
            safe: true,
            reduceTransforms: false,
            advanced: false,
            compatibility: 'ie7',
            keepSpecialComments: 0
        }))
        .pipe(gulp.dest(destTarget))
        .on('end', reloadHandler);;
}

 
/**
 * [imageminImg 图片压缩]
 * @return {[type]} [description]
 */
function imageminImg(cb, file) {
    var destTarget = file ? path.dirname(file).replace('src', 'dist') : paths.dist.dir;
    return gulp.src(`./src/assets/images/*.*`)
        .pipe(plumber())
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/assets/images/'))
        .on('end', reloadHandler);;
}
function imgImgs(){
   return gulp.src(`./src/assets/images/*.*`)
          .pipe(imagemin())
          .pipe(gulp.dest('dist/assets/images'))
          .on('end', reloadHandler);
}
/**
 * [compileJs 编译压缩JS]
 * @return {[type]} [description]
 */
function compileJs(cb, file) {
    var destTarget = file ? path.dirname(file).replace('src', 'dist') : paths.dist.dir,
        jsFilter = filter('**/page-*.js', { restore: true })
    return gulp.src('src/**/*.js')
        
        // .pipe(jsFilter)
        // .pipe(seajsCombo({
        //     ignore: ['jquery', 'bootstrap', 'bootstrap.min']
        // }))
        // .pipe(jsFilter.restore)
        // .pipe(uglify({
        //    mangle: {
        //        except: ['$', 'require', 'exports', 'module']
        //    }
        // }))
        .pipe(plumber())
        // .pipe(babel())
        // .pipe(babel({
        //     presets: ['@babel/env'],
        //     plugins: ['@babel/plugin-transform-runtime']
        // }))
        .pipe(uglify())
        
        .pipe(gulp.dest(destTarget))
        .on('end', reloadHandler);;
}
//html 编译
function compileHtml(cb, file) {
    var destTarget = file ? path.dirname(file).replace('src', 'dist') : paths.dist.html;
    return gulp.src(file || paths.src.html)
        .pipe(ejs(ejshelper()))
        .pipe(gulpif(
            config.supportREM,
            posthtml(
                posthtmlPx2rem({
                    rootValue: 40,
                    minPixelValue: 2
                })
            )))
        .pipe(htmltpl({
            tag: 'template',
            paths: ['./src/'],
            engine: function(template, data) {
                return template && artTemplate.compile(template)(data);
            },
            data: {      //初始化数据
                header: false,
                g2: false
            }
        }))
        .pipe(gulp.dest(paths.dist.html))
        .pipe(usemin({
            css: [minifyCSS],
            js: [uglify],
            inlinejs: [uglify],
            inlinecss: [minifyCSS, 'concat']
        }))
        .pipe(gulp.dest(destTarget))
        .on('end', reloadHandler);;
}
function iconFont(cb, file){
    var destTarget = file ? path.dirname(file).replace('src', 'dist') : paths.dist.html;
    return gulp.src('./src/assets/fonts')
    .pipe(gulp.dest('dist/assets/'))
    .on('end', reloadHandler);;
}
//启动 livereload
function startServer(cb) {
    bs.init({
        server: serverConfig,
        port: config['livereload']['port'] || 8091,
        // startPath: config['livereload']['startPath'] || '/',
        open:false,
        reloadDelay: 0,
        directory: true,
        notify: { //自定制livereload 提醒条
            styles: [
                "margin: 0",
                "padding: 5px",
                "position: fixed",
                "font-size: 10px",
                "z-index: 9999",
                "bottom: 0px",
                "right: 0px",
                "border-radius: 0",
                "border-top-left-radius: 5px",
                "background-color: rgba(60,197,31,0.5)",
                "color: white",
                "text-align: center"
            ]
        }
    });
    cb();
}
var watchHandler = function(type, file) {
    var target = path.extname(file),
        destTarget = path.dirname(file).replace('src', 'dist');
    switch (target) {
        case '.jpg':
        case '.png':
        case '.gif':
        case '.bmp':
            if (type === 'removed') {
                var tmp = file.replace('src', 'dist');
                del([tmp]);
            } else {
                imageminImg();
            }
            break;

        case '.js':
            if (type === 'removed') {
                var tmp = file.replace('src', 'dist');
                del([tmp]);
            } else {
                compileJs();
            }
            break;

        case '.mp3':
        case '.swf':
        case '.ttf':
        case '.woff':
        case '.svg':
        case '.woff2':
            if (type === 'removed') {
                var tmp = file.replace('src', 'dist');
                del([tmp]);
            } else {
                copyHandler('media', file);
            }
            break;

        case '.css':

            if (type === 'removed') {
                var tmp = file.replace('src', 'dist').replace(target, '.css');
                del([tmp]);
            } else {
                // compileCss();
                // reloadHandler();
                return gulp.src(file)
                    .pipe(plumber())
                    .pipe(postcss(postcssOption))
                    .pipe(minifyCSS({
                        safe: true,
                        reduceTransforms: false,
                        advanced: false,
                        compatibility: 'ie7',
                        keepSpecialComments: 0
                    }))
                    .pipe(gulp.dest(destTarget))
                    .on('end', reloadHandler);
            }

            break;
        case '.scss':
            if (type === 'removed') {
                var tmp = file.replace('src', 'dist').replace(target, '.css');
                del([tmp]);
                compileSass();
                reloadHandler();
            } else {
                let c = gulp.src(file)
                    .pipe(plumber())
                    .pipe(sass())
                    .pipe(postcss(postcssOption))
                    .pipe(minifyCSS({
                        safe: true,
                        reduceTransforms: false,
                        advanced: false,
                        compatibility: 'ie7',
                        keepSpecialComments: 0
                    }))

                .pipe(gulp.dest(destTarget))
                    .on('end', reloadHandler);
                    compileSass();
                    reloadHandler();
                    return c

            }
          
            break;
        case '.html':
            if (type === 'removed') {
                del([file])
            } else {
                compileHtml();
            }
            break;
    }

};

//监听文件
function watch(cb) {
   var watcher = gulp.watch([
        './src/**/*'
    ],  { ignored: /[\/\\]\./, usePolling: true });
    watcher
      .on('change', function (file) {
        console.log(file + ' has been changed');
        watchHandler('changed', file);
      })
      .on('add', function (file) {
        console.log(file + ' has been added');
        watchHandler('add', file);
      });
      cb()
  }
gulp.task('default', gulp.series(
    delDist,
    gulp.parallel(
        compileSass,
        // compileCss,
        imageminImg,
        copyMedia,
        compileJs,
        iconFont,
        // imgImgs
    ),
    compileAutoprefixer,
    miniCSS,
    
    compileHtml,
    watch,
    startServer
));
gulp.task('delDist', gulp.series(delDist));
