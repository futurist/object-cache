const o = require('objutil')
const {isArray} = Array
const {assign} = Object

/*
  this.name: String
  this.data: Array of Objects
  this.config: Object {
    idKey: 'id'  // default id index key
  }
  this.indexDef: Object {
    id: {unique: true},
    'parentID.id': {multiple: true}
  }
  this.index: Object {
    'id':{
      '1': 0,
      '2': 3,
    },
    'parentID.id':{
      '100': [5,6],
      '101': [7,8]
    }
  }
   */

function MemDB (name, dataArray, indexDef, config) {
  if(name==null) throw Error('table name is required')
  this.name = name
  this.config = assign({
    idKey: 'id'
  }, config)
  indexDef = assign({
    [this.config.idKey]: {unique: true}
  }, indexDef)

  this.clear()
  if(isArray(dataArray)) {
    this.data = dataArray
  }
  if(indexDef){
    Object.keys(indexDef).forEach(key=>this.createIndex(key, indexDef[key]))
  }
}

// class methods
MemDB.prototype.clear = function (name) {
  // data is Array, item is Object, always increase(push)
  // when remove, just set to null, not using DELETE!!!
  // https://www.smashingmagazine.com/2012/11/writing-fast-memory-efficient-javascript/
  this.data = []
  this.index = Object.create(null)
  this.indexDef = Object.create(null)

}

MemDB.prototype.createIndex = function(key, def) {
  if(def===null) return
  def = def || {}
  const {data, index} = this
  if(key in index) return

  this.indexDef[key] = def
  const keyObj = index[key] = Object.create(null)
  data.forEach((v, i)=>{
    if(v==null) return

    // assign index data code block
    const id = o.got(v, key)
    if(def.multiple){
      let arr = keyObj[id]
      if(!isArray(arr)) arr = keyObj[id] = []
      arr.push(i)
    } else {
      keyObj[id] = i
    }

  })
  return true
}

MemDB.prototype.find = function (key, id, returnIndex) {
  const {data, index} = this

  const keyObj = index[key]
  if (keyObj==null) {  // null:deleted,  undefined:not exists
    return
  }
  const d = keyObj[id]
  if(returnIndex) return d
  return isArray(d)
    ? d.map(i=>data[i]).filter(Boolean)
    : data[d]
}

MemDB.prototype.insert = function (obj) {
  if(obj==null) return {ok: 0}
  const {data, index, indexDef} = this

  const i = data.length
  for(let key in indexDef){
    const def = indexDef[key]
    const keyObj = index[key]
    if(def==null || keyObj==null) continue

    // assign index data code block
    const id = o.got(obj, key)
    if(def.unique && !isEmptyData(this.find(key, id))) return {
      error: 'duplicate key of '+key+', id:'+id
    }
    if(def.multiple){
      let arr = keyObj[id]
      if(!isArray(arr)) arr = keyObj[id] = []
      arr.push(i)
    } else {
      keyObj[id] = i
    }

  }

  data[i] = obj

  return {ok: 1}
}


MemDB.prototype.delete = function (key, id) {
  const d = this.find(key, id, true)
  if(isEmptyData(d)) return {ok: 0}
  if(isArray(d)) d.forEach(i=>this.data[i] = null)  // never delete!
  else this.data[d] = null
  return {ok: 1}
}

MemDB.prototype.update = function (key, id, newItem) {

}

// export the class
module.exports = MemDB

function isEmptyData(obj){
  return obj==null
  || isArray(obj) && obj.length==0
}

