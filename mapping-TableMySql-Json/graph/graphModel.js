var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'root@123',
        database: 'cloudclass'
    }
})

class GraphModel{
    constructor(){
        this.db = knex;
    }

    getAll(tableName) {
        return new Promise( (resolve, reject) => {
            this.db(tableName).select('*')
            .then( res => resolve(res))
            .catch( err => reject(err));
        })
    }
    getManyRef(tableRef,parentId,key){
        return new Promise((resolve,reject)=>{
            this.db(tableRef).select("*")
                .where(key,parentId)
                .then(res =>resolve(res))
                .catch(err => reject(err))
        })
    }

    getRefOne(tableRef,keyId){
        return new Promise((resolve,reject)=>{
            this.db(tableRef).select("*")
                .where('id',keyId)
                .then(res => {resolve(res[0])})
                .catch(err => reject(err))
        })
    }
}

module.exports = GraphModel;