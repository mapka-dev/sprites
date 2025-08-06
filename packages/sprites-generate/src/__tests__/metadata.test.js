import {describe, expect, test} from 'vitest';
import {readFileSync} from 'fs';
import {extractMetadata} from '../metadata.js';
import {validateMetadata} from '../validate.js';

test('image without metadata', function() {
    extractMetadata({
        svg: readFileSync(`${__dirname}/fixture/svg/aerialway-24.svg`, 'utf-8')
    }, function(err, metadata) {
        expect(err).toBeNull();
        expect(metadata).toEqual({});
    });
});

test('image with nested metadata', () => {
    extractMetadata({
        svg: readFileSync(`${__dirname}/fixture/svg-metadata/cn-nths-expy-2-affinity.svg`, 'utf-8')
    }, function(err, metadata) {
       expect(err).toBeNull();
       expect(metadata).toEqual({
            stretchX: [[4, 16]],
            stretchY: [[5, 16]],
            content: [2, 5, 18, 18]
        });
    });
});

test('image exported by Illustrator', () => {
    extractMetadata({
        svg: readFileSync(`${__dirname}/fixture/svg-metadata/shield-illustrator.svg`)
    }, function(err, metadata) {
        expect(err).toBeNull();
        expect(metadata).toEqual({
            content: [4, 8, 14, 14],
            stretchY: [[8, 14]],
            stretchX: [[4, 14]]
        });
    });
});

test('image exported by Illustrator, rotated', () => {
    extractMetadata({
        svg: readFileSync(`${__dirname}/fixture/svg-metadata/shield-illustrator-rotated.svg`)
    }, function(err, metadata) {
        expect(err).toBeNull();
        expect(metadata).toEqual({
            content: [3.703, 5.806, 12.189, 14.291],
            stretchY: [[10.58, 14.257]],
            stretchX: [[3.73, 9.528]]
        });
    });
});

test('image exported by Illustrator, rotated + translated', () => {
    extractMetadata({
        svg: readFileSync(`${__dirname}/fixture/svg-metadata/shield-illustrator-rotated-translated.svg`)
    }, function(err, metadata) {
        expect(err).toBeNull();
        expect(metadata).toEqual({
            content: [4.242, 7.07, 11.313, 14.142],
            stretchY: [[10.606, 14.142]],
            stretchX: [[4.242, 9.192]]
        });
    });
});

test('image exported by Illustrator, rotated + reversed', () => {
    extractMetadata({
        svg: readFileSync(`${__dirname}/fixture/svg-metadata/shield-illustrator-rotated-reversed.svg`)
    }, function(err, metadata) {
        expect(err).toBeNull();
        expect(metadata).toEqual({
            content: [6, 8, 12, 12],
            stretchY: [[8, 12]],
            stretchX: [[6, 12]]
        });
    });
});

test('image with one stretch rect', () => {
    extractMetadata({
        svg: readFileSync(`${__dirname}/fixture/svg-metadata/cn-nths-expy-2-inkscape-plain.svg`)
    }, function(err, metadata) {
        expect(err).toBeNull();
        expect(metadata).toEqual({
            stretchX: [[3, 17]],
            stretchY: [[5, 17]],
        });
    });
});

test('image with multiple stretch zones', () => {
    extractMetadata({
        svg: readFileSync(`${__dirname}/fixture/svg-metadata/ae-national-3-affinity.svg`)
    }, function(err, metadata) {
        expect(err).toBeNull();
        expect(metadata).toEqual({
            stretchX: [[5, 7], [20, 22]],
            content: [3, 7, 23, 18]
        });
    });
});

test('image with multiple stretch zones and higher pixelRatio', () => {
    extractMetadata({
        pixelRatio: 2,
        svg: readFileSync(`${__dirname}/fixture/svg-metadata/ae-national-3-affinity.svg`)
    }, function(err, metadata) {
        expect(err).toBeNull();
        expect(metadata).toEqual({
            stretchX: [[10, 14], [40, 44]],
            content: [6, 14, 46, 36]
        });
    });
});

test('invalid svg', () => {
    extractMetadata({ svg: '<svg>' }, function(err) {
        expect(err).toMatchObject({ message: "<input>:1:5: Unclosed root tag" });
    });
});


describe('invalid images', function(t) {
    test('content area without height', function(t) {
        extractMetadata({ svg: '<svg><rect id="mapbox-icon-content" x="0" y="0" width="30"/></svg>' }, function(err, metadata) {
            expect(err).toBeNull();
            expect(metadata).toEqual({})
        });
    });

    test('invalid mapbox-icon-* ID', function(t) {
        extractMetadata({ svg: '<svg><rect id="mapbox-icon-none" x="0" width="30" height="20"/></svg>' }, function(err, metadata) {
            expect(err).toBeNull();
            expect(metadata).toEqual({})
        });
    });

    test('no path data', function(t) {
        extractMetadata({ svg: '<svg><path id="mapbox-icon-content"/></svg>' }, function(err, metadata) {
            expect(err).toBeNull();
            expect(metadata).toEqual({})
        });
    });


    test('invalid path data', function(t) {
        extractMetadata({ svg: '<svg><path id="mapbox-icon-content" d="hello"/></svg>' }, function(err, metadata) {
            expect(err).toBeNull();
            expect(metadata).toEqual({})
        });
    });
});

test('valid metadata', function() {
    const img = { width: 24, height: 18 };

    expect(validateMetadata(img, {})).toBeNull();

    expect(validateMetadata(img, { content: [ 2, 2, 22, 16 ] })).toBeNull();
    expect(validateMetadata(img, { content: [ 0, 0, 24, 18 ] })).toBeNull();

    expect(validateMetadata(img, { stretchX: [] })).toBeNull();
    expect(validateMetadata(img, { stretchX: [[10, 14]] })).toBeNull();
    expect(validateMetadata(img, { stretchY: [[8, 10]] })).toBeNull();
});


test('invalid metadata', function() {
    expect(validateMetadata()).toMatchObject({ message: 'image is invalid' }, 'rejects missing object');
    expect(validateMetadata({})).toMatchObject({ message: 'image has invalid metadata' }, 'rejects missing object');
    
    expect(validateMetadata({}, {})).toMatchObject({ message: 'image has invalid width' }, 'rejects missing width');
    expect(validateMetadata({ width: 0 }, {})).toMatchObject({ message: 'image has invalid width' }, 'rejects zero width');
    expect(validateMetadata({ width: -3 }, {})).toMatchObject({ message: 'image has invalid width' }, 'rejects negative width');
    expect(validateMetadata({ width: 32 }, {})).toMatchObject({ message: 'image has invalid height' }, 'rejects missing height');
    expect(validateMetadata({ width: 32, height: {} }, {})).toMatchObject({ message: 'image has invalid height' }, 'rejects height as object');
    expect(validateMetadata({ width: 32, height: -32 }, {})).toMatchObject({ message: 'image has invalid height' }, 'rejects negative height');

    const img = { width: 24, height: 18 };

    expect(validateMetadata(img, { content: {} })).toMatchObject(
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');
    expect(validateMetadata(img, { content: [] })).toMatchObject(
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');
    expect(validateMetadata(img, { content: [ 1, 2, 3 ] })).toMatchObject(
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');
    expect(validateMetadata(img, { content: [ 1, 2, 3, 4, 5 ] })).toMatchObject(
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');
    expect(validateMetadata(img, { content: [ 1, 2, 3, true ] })).toMatchObject(
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');

    expect(validateMetadata(img, { content: [ 4, 4, 4, 4 ] })).toMatchObject(
        { message: 'image content area must be positive' }, 'rejects invalid content area size');
    expect(validateMetadata(img, { content: [ 4, 4, 2, 2 ] })).toMatchObject(
        { message: 'image content area must be positive' }, 'rejects invalid content area size');
    expect(validateMetadata(img, { content: [ 0, 0, 25, 18 ] })).toMatchObject(
        { message: 'image content area must be within image bounds' }, 'rejects invalid content area size');
    expect(validateMetadata(img, { content: [ 0, 0, 24, 19 ] })).toMatchObject(
        { message: 'image content area must be within image bounds' }, 'rejects invalid content area size');
    expect(validateMetadata(img, { content: [ -1, 0, 24, 18 ] })).toMatchObject(
        { message: 'image content area must be within image bounds' }, 'rejects invalid content area size');
    expect(validateMetadata(img, { content: [ 0, -1, 24, 18 ] })).toMatchObject(
        { message: 'image content area must be within image bounds' }, 'rejects invalid content area size');

    expect(validateMetadata(img, { stretchX: {} })).toMatchObject(
        { message: 'image stretchX zones must be an array' }, 'rejects invalid stretchX format');
    expect(validateMetadata(img, { stretchX: [ 'yes' ] })).toMatchObject(
        { message: 'image stretchX zone must consist of two numbers' }, 'rejects invalid stretchX format');
    expect(validateMetadata(img, { stretchX: [ [] ] })).toMatchObject(
        { message: 'image stretchX zone must consist of two numbers' }, 'rejects invalid stretchX format');
    expect(validateMetadata(img, { stretchX: [ [ 4, 4, 4 ] ] })).toMatchObject(
        { message: 'image stretchX zone must consist of two numbers' }, 'rejects invalid stretchX format');
    expect(validateMetadata(img, { stretchX: [ [ 4, 5 ], [ 6, null ] ] })).toMatchObject(
        { message: 'image stretchX zone must consist of two numbers' }, 'rejects invalid stretchX format');

    expect(validateMetadata(img, { stretchX: [ [ 4, 4 ] ] })).toMatchObject(
        { message: 'image stretchX zone may not be zero-size' }, 'rejects invalid stretchX size');
    expect(validateMetadata(img, { stretchX: [ [ 8, 4 ] ] })).toMatchObject(
        { message: 'image stretchX zone may not be zero-size' }, 'rejects invalid stretchX size');
    expect(validateMetadata(img, { stretchX: [ [ -2, 2 ] ] })).toMatchObject(
        { message: 'image stretchX zone must be within image bounds' }, 'rejects invalid stretchX size');
    expect(validateMetadata(img, { stretchX: [ [ 0, 25 ] ] })).toMatchObject(
        { message: 'image stretchX zone must be within image bounds' }, 'rejects invalid stretchX size');
    expect(validateMetadata(img, { stretchX: [ [ 0, 24.999 ] ] })).toMatchObject(
        { message: 'image stretchX zone must be within image bounds' }, 'rejects invalid stretchX size');

    expect(validateMetadata(img, { stretchX: [ [ 0, 2 ], [ 1, 3 ] ] })).toMatchObject(
        { message: 'image stretchX zones may not overlap' }, 'rejects overlapping stretchX zones');
    expect(validateMetadata(img, { stretchX: [ [ 0, 24 ], [ 8, 16 ] ] })).toMatchObject(
        { message: 'image stretchX zones may not overlap' }, 'rejects overlapping stretchX zones');
    expect(validateMetadata(img, { stretchX: [ [ 18, 24 ], [ 0, 6 ] ] })).toMatchObject(
        { message: 'image stretchX zones may not overlap' }, 'rejects unsorted stretchX zones');
});
