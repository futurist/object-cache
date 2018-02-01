
function ObjectCache (name, expiry) {
  if(name==null) throw Error('name is required')
  this.cache = {
    createdOn: new Date().getTime(),
    expiry,
    data: Object.create(null)
  }
  this.name = name
}

// class methods
ObjectCache.prototype.clear = function () {
  this.cache.createdOn = new Date().getTime()
  this.cache.data = Object.create(null)
}

ObjectCache.prototype.get = function (key) {
  const {data, createdOn, expiry} = this.cache

  // check if the data is still valid
  if (!isNaN(expiry)
    && new Date().getTime() - createdOn >= expiry * 1000) {
    this.clear()
    return // data has expired, so return a miss
  }
  const record = data[key]
  if (record==null) {  // null:deleted,  undefined:not exists
    // the record is not in the cache
    return
  }
  return record
}

ObjectCache.prototype.put = function (key, record) {
  this.cache.data[key] = record
}

// export the class
module.exports = ObjectCache

