const _ = require('lodash');
const fs = require('fs');


const validateRequiredFields = (obj, fieldsToInclude) => {
    let new_entity = {};

    //  Prepare the new entity with all the required fields
    for (let index = 0; index < fieldsToInclude.length; index++) {
        
        let field = fieldsToInclude[index];

        if (obj.hasOwnProperty(field)) {
            new_entity[ field ] = obj[ field ]
        }else{
            throw {
                isCustomError: true,
                body: errors.MISSING_PROPERTY.replace('@PROPERTY', field)
            }
        }

    }

    return new_entity;
};

const transformArrayToOneDimension = (arrayOfNDimensions) => {
    if(!Array.isArray(arrayOfNDimensions)){
        return [arrayOfNDimensions]
    }
    return _.uniq(arrayOfNDimensions.reduce((acum, item) =>{
        if(Array.isArray(item)){
          return [
            ...acum,
            ...transformArrayToOneDimension(item) 
          ]
        }else{
          
          return [
            ...acum,
            item
          ] 
        }
      } ,[]))
};

const printRoutes = (path, layer) => {
    if (layer.route) {
        layer.route.stack.forEach(printRoutes.bind(null, path.concat(split(layer.route.path))))
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(printRoutes.bind(null, path.concat(split(layer.regexp))))
    } else if (layer.method) {
        console.log('%s /%s',
            layer.method.toUpperCase(),
            path.concat(split(layer.regexp)).filter(Boolean).join('/'))
    }
};

const split = thing => {
    if (typeof thing === 'string') {
        return thing.split('/')
    } else if (thing.fast_slash) {
        return ''
    } else {
        var match = thing.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
        return match
            ? match[1].replace(/\\(.)/g, '$1').split('/')
            : '<complex:' + thing.toString() + '>'
    }
};

const replaceAll = (text, search, replacement) => {
    //for (var x in obj) {
        text = text.replace(new RegExp(search, 'g'), replacement);
    
    return text;
};

const camelize = function camelize(str) {
    const firstUpper = str.replace(/[\W_]+(.)/g, function (match, chr) {
        return chr.toUpperCase();
    });
    return firstUpper.charAt(0).toUpperCase() + firstUpper.slice(1)
};

const writeJsonFile = (targetPath, jsonContent) => {
    fs.writeFileSync(targetPath, JSON.stringify(jsonContent, null, 2))
}

const generateRandomString = (length, stringsTaken) => {

    const generateString = (length) => {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    if(stringsTaken == undefined || stringsTaken.length == 0){
        return generateString(length);
    }
    let current_string;
    let is_valid = false;
    do {
        current_string = generateString(length);
        
        is_valid = stringsTaken.reduce((acum, item) => {
            return (acum && !(current_string == item))
        }, true)
    } while (!is_valid);

    return current_string;
 }

module.exports = {
    validateRequiredFields,
    transformArrayToOneDimension,
    printRoutes,
    replaceAll,
    camelize,
    writeJsonFile,
    generateRandomString
};