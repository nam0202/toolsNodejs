var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'root@123',
        database: 'cloudclass'
    }
})

var realation= [];

knex.raw("SELECT `TABLE_NAME`,`COLUMN_NAME`,`REFERENCED_TABLE_NAME`,`REFERENCED_COLUMN_NAME`" +
    "FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`" +
    "WHERE `REFERENCED_TABLE_NAME` IS NOT NULL AND `TABLE_SCHEMA` = 'cloudclass' ").then((res) => {
        realation =res[0]; 
        getTable(true,false);
})

const fs = require('fs');
var getRef = (tableName)=>{
    return new Promise((resolve,reject)=>{
        var lengt =  realation.length;
        var ref = [];
        for(let i=0;i< lengt;i++){
            if(realation[i].TABLE_NAME === tableName){
                let oneRef = {};
                oneRef.one = realation[i].REFERENCED_TABLE_NAME;
                oneRef.key = realation[i].COLUMN_NAME;
                ref.push(oneRef);
                realation.shift();
            }else{
                break;
            }
        }
        resolve(ref);
    })
}
var getTable =()=>{
    var define = JSON.parse(fs.readFileSync('./test/cloud/meta.json','utf8')).definitions;
    knex.raw("show tables").then((res) => {
        let l = res[0].length;
        for(let i=0;i<l;i++){
            let tableName = res[0][i].Tables_in_cloudclass;
            knex.raw(`show columns from ${tableName}`).then(async (response) => {
                let Object = {};
                Object[tableName]={}
                Object[tableName].properties = [];
                Object[tableName].api = "all";
                Object[tableName].ref = await getRef(tableName);
                for(let j=0;j<response[0].length;j++){
                    let field = {};
                    field.name = response[0][j].Field;
                    field.type = response[0][j].Type;
                    Object[tableName].properties.push(field);
                }
                define.push(Object);
                fs.writeFile(`./data/${res[0][i].Tables_in_cloudclass}.json`,JSON.stringify(Object),(err)=>{
                    if(err) console.log(err);
                    return
                })
                console.log(Object[tableName]);
            })
        }
    })
    setTimeout(()=>{
        console.log(define)
        fs.writeFile('./test/cloud/meta.json',JSON.stringify({definitions:define}),(err)=>{
            if(err) console.log(err);
            
        })
    },1000*5)
}
