import { optimize } from 'svgo';
import svgBoundings from 'svg-boundings';

const computePathBounds = svgBoundings.path;

const metadataPrefix = 'mapbox-';

// Each optimize() pass re-parses the previous output, and svgo 4's parser rejects
// unbound namespace prefixes, so the metadata lives in an un-prefixed attribute.
const metadataAttribute = 'data-mapbox-metadata';

// Removes `style` attribute. Otherwise, transforms will not apply.
// Refer to https://github.com/svg/svgo/blob/a9834efa1603198ae606765292215462ae193d0d/plugins/applyTransforms.js#L55-L57
const removeStyleAttribute = {
    name: 'removeStyleAttribute',
    fn: () => ({
        element: {
            enter: (node) => {
                delete node.attributes.style;
            }
        }
    })
};

// Transforms `id="mapbox-*"` into `data-mapbox-metadata="*"` so that the `convertPathData` step
// resolves transforms.
const renameMapboxMetadata = {
    name: 'renameMapboxMetadata',
    fn: () => ({
        element: {
            enter: (node) => {
                const id = node.attributes.id;
                if (id != null && id.startsWith(metadataPrefix)) {
                    delete node.attributes.id;
                    node.attributes[metadataAttribute] = id.substring(metadataPrefix.length);
                }
            }
        }
    })
};

/**
 * Decrease accuracy of floating-point numbers
 * in path data keeping a specified number of decimals.
 * Smart rounds values like 2.3491 to 2.35 instead of 2.349.
 * Doesn't apply "smartness" if the number precision fits already.
 *
 * Taken from svgo at https://github.com/svg/svgo/blob/72db8eb/plugins/convertPathData.js#L773
 */
function strongRound(value, precision) {
    if (!precision) {
        precision = 3;
    }
    const error = +Math.pow(0.1, precision).toFixed(precision);
    if (+value.toFixed(precision) !== value) {
        var rounded = +value.toFixed(precision - 1);
        value = +Math.abs(rounded - value).toFixed(precision + 1) >= error ?
            +value.toFixed(precision) :
            rounded;
    }
    return value;
}

// Plugin for use with svgo that extracts metadata from paths into `info.metadata`.
function extractMapboxMetadata(info) {
    return {
        name: 'extractMapboxMetadata',
        fn: () => ({
            element: {
                enter: (node) => {
                    const metadata = node.attributes[metadataAttribute];
                    const d = node.attributes.d;
                    if (node.name !== 'path' || metadata == null || d == null) {
                        return;
                    }
                    const bounds = computePathBounds({ d }, true);

                    // Make sure that we actually have a valid bounding box.
                    if (!Number.isFinite(bounds.left) || !Number.isFinite(bounds.right) ||
                        !Number.isFinite(bounds.top) || !Number.isFinite(bounds.bottom)) {
                        return;
                    }

                    // Scale bounds by pixel ratio.
                    bounds.left = strongRound(bounds.left * info.pixelRatio);
                    bounds.top = strongRound(bounds.top * info.pixelRatio);
                    bounds.right = strongRound(bounds.right * info.pixelRatio);
                    bounds.bottom = strongRound(bounds.bottom * info.pixelRatio);

                    if (metadata.startsWith('stretch-x')) {
                        (info.metadata.stretchX = info.metadata.stretchX || []).push([bounds.left, bounds.right]);
                    } else if (metadata.startsWith('stretch-y')) {
                        (info.metadata.stretchY = info.metadata.stretchY || []).push([bounds.top, bounds.bottom]);
                    } else if (metadata === 'stretch') {
                        (info.metadata.stretchX = info.metadata.stretchX || []).push([bounds.left, bounds.right]);
                        (info.metadata.stretchY = info.metadata.stretchY || []).push([bounds.top, bounds.bottom]);
                    } else if (metadata === 'content' || metadata === 'text-placeholder') {
                        const key = metadata === 'content' ? 'content' : 'placeholder';
                        info.metadata[key] = [bounds.left, bounds.top, bounds.right, bounds.bottom];
                    }
                }
            }
        })
    };
}

const preparePlugins = [
    {
        name: 'cleanupIds',
        params: {
            // Remove all IDs first so that `convertPathData` resolves transforms.
            preservePrefixes: ['mapbox-']
        }
    },
    renameMapboxMetadata,
    'convertShapeToPath'
];

const collapsePlugins = [
    'convertTransform',
    'moveGroupAttrsToElems',
    'collapseGroups'
];

function extractPlugins(info) {
    return [
        removeStyleAttribute,
        {
            name: 'convertPathData',
            params: {
                // svg-boundings has trouble parsing consecutive numbers without space and without a leading
                // zero. Therefore, we force leading zeros. Note that this option confusingly has to be set
                // to _false_ to produce leading zeros.
                // See https://github.com/kfitfk/svg-boundings/issues/2
                leadingZero: false
            }
        },
        extractMapboxMetadata(info)
    ];
}

/**
 * Parses a SVG document and extracts metadata from its shapes and paths.
 *
 * @param   {Object}                [img]
 * @param   {Buffer|string}         [img.svg]             A string of the SVG.
 * @param   {number}                [img.pixelRatio]      Ratio of a 72dpi screen pixel to the destination pixel density
 * @param   {Function}              callback              Accepts two arguments, `err` and `metadata` Object
 * @return  {Metadata}              metadata              An object with the extracted information.
 */
export function extractSvgMetadata(img, callback) {
    try {
        const imgSvg = Buffer.isBuffer(img.svg) ? img.svg.toString('utf-8') : img.svg;

        // We'll add the metadata that we extract in the svgo plugin above to this object.
        const info = {
            metadata: {},
            pixelRatio: Number.isFinite(img.pixelRatio) && img.pixelRatio || 1
        };

        try {
            // A few initial plugins prepare the data, e.g. by moving IDs to custom attributes.
            let svg = optimize(imgSvg, { plugins: preparePlugins }).data;

            // We'll walk through the plugins that collapse groups until there are no changes to the output.
            let previousSVG;
            do {
                previousSVG = svg;
                svg = optimize(svg, { plugins: collapsePlugins }).data;
            } while (previousSVG !== svg);

            // Finally, we'll run through the plugins that actually read and parse the metadata.
            optimize(svg, { plugins: extractPlugins(info) });
        } catch (err) {
            return callback(err);
        }

        // Sort stretches ascending.
        for (const key of ['stretchX', 'stretchY']) {
            if (info.metadata[key]) {
                info.metadata[key].sort((a, b) => a[0] - b[0]);
            }
        }

        callback(null, info.metadata);
    } catch (err) {
        return callback(err);
    }
}

