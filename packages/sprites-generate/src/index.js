const generate = require('./generate');

exports.generateLayout = generate.generateLayout;
exports.generateLayoutUnique = generate.generateLayoutUnique;
exports.generateImage = generate.generateImage;
exports.generateOptimizedImage = generate.generateOptimizedImage;

exports.extractMetadata = require('./extract-svg-metadata');
exports.validateMetadata = require('./validate-svg-metadata');
