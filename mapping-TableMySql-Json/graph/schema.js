const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull,
    GraphQLID,
    GraphQLField,
    Thunk
} = require('graphql');
const fs = require('fs');
const path = require('path');
const glob = require('glob')
const GraphModel = require('./graphModel');
const graphModel = new GraphModel();

class Schema {
    constructor(_rootPath) {
        this.rootPath = _rootPath;
        this.query = null;
        this.mutation = null;
        this.listObject = [];
        this.files = glob.sync('**/*.@(json)', { cwd: `${_rootPath}/data` });
        this.count = 0;
        this.init();


    }
    setUpRef(refs, nameParent) {
        let isDuplicate = refs.findIndex(e =>e.one === nameParent);
        if(isDuplicate>-1){
            refs.splice(isDuplicate,1);
        }//oke
        var allRefs = {};
        for (let i = 0; i < refs.length; i++) {
            let name = refs[i].one;//ten cua Object
            let key = refs[i].key;
            let isExist = this.listObject.findIndex(e => e.toString() === name);
            if (isExist > -1) {
                allRefs[name] = {
                    type: this.listObject[isExist],
                    resolve: (parent, args) => {
                        console.log(graphModel);
                        return graphModel.getRefOne(name, parent[key]);
                    }
                }
            } else {
                let obj = JSON.parse(fs.readFileSync(`${this.rootPath}/data/${name}.json`, 'utf8'))[name];
                let fields = {};
                let properties = obj.properties;
                for (let j = 0; j < properties.length; j++) {
                    fields[properties[j].name] = {};
                    fields[properties[j].name].type = (properties[j].type.indexOf('int') != -1) ? GraphQLInt : GraphQLString;
                }
                let ref = this.setUpRef(obj.ref, name);
                fields = Object.assign({}, fields, ref);
                let grapObj = new GraphQLObjectType({
                    name: name,
                    fields: fields
                });
                this.listObject.push(grapObj);
                allRefs[name] = {
                    type: this.listObject[this.listObject.length-1],
                    resolve: (parent, args) => {
                        return graphModel.getRefOne(name, parent[key]);
                    }
                }
            }
        }
        return allRefs;
    }
    setupListObject() {
        for (let i = 0; i < this.files.length; i++) {
            let name = this.files[i].split('.')[0];
            let checked = this.listObject.findIndex(e => e.toString() === name);
            if (checked > -1) {
                continue;
            }
            let obj = JSON.parse(fs.readFileSync(`${this.rootPath}/data/${this.files[i]}`, 'utf8'))[name];

            let fields = {};
            let properties = obj.properties;
            for (let j = 0; j < properties.length; j++) {
                fields[properties[j].name] = {};
                fields[properties[j].name].type = (properties[j].type.indexOf('int') != -1) ? GraphQLInt : GraphQLString;
            }
            let ref = this.setUpRef(obj.ref, name);
            fields = Object.assign({}, fields, ref);
            let grapObj = new GraphQLObjectType({
                name: name,
                fields: fields
            });
            this.listObject.push(grapObj);
        }
    }

    init() {
        this.setupListObject();
        var queryObjet = {};
        for (let i = 0; i < this.listObject.length; i++) {
            queryObjet[this.listObject[i]] = {
                type: new GraphQLList(this.listObject[i]),
                args: {},
                resolve(source, args, root, ast) {
                    let query = root.body.query;
                    let tableName = query.replace('query ', '').split('{')[1].trim();
                    return graphModel.getAll(tableName);
                }
            }
        }
        this.query = new GraphQLObjectType({
            name: 'Query',
            description: 'Root query Object',
            fields: () => {
                return queryObjet
            }
        })
    }

    getSchema() {
        console.log(this.query);
        return new GraphQLSchema({
            query: this.query,
            mutation: this.mutation
        })
    }
}

module.exports = Schema;