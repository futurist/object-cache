import db from '../'
import test from 'ava'
import util from 'util'
// import stream from '../stream'

var memwatch = require('memwatch-next')
memwatch.on('leak', function(info) {
  console.log('Memory Leak!!!', info)
})
memwatch.on('stats', function(info) {
  console.log(info)
})


test('init', t => {
  const data = [{id:1, a:2, c:3}, {id:2, a:5, c:6}]
  const d = new db(data)
  t.is(d.data, data)
  t.deepEqual(d.config, {
    idKey: 'id'
  })
  t.deepEqual(d.indexDef, {id: {
    unique: true
  }})
  t.deepEqual(d.index, {id: {
    1:0,
    2:1,
  }})
})


test('create Index', t => {
  const data = [
    {id:1, parentID:[{id:20}, {id:21}], c:3}, 
    {id:2, parentID:[{id:20}, {id:23}], c:4}, 
  ]
  const d = new db(data, {
    'parentID.$.id': {multiple: true},
  })
  // console.log(util.inspect(d.index))
  t.deepEqual(d.index, {
    id:{
      1:0,
      2:1
    },
    'parentID.$.id':{
      20:[0,1],
      21: [0],
      23: [1]
    }
  })
})


test('find', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
    {id:3, parentID:{id:3}, c:7}
  ]
  const d = new db(data, {
    'parentID.id': {multiple: true},
    'parentID2.id': {multiple: true},
  })
  // console.log(util.inspect(d.index))

  t.deepEqual(d.find('id', 2), data[1])
  t.deepEqual(d.find('id', 20), undefined)
  t.deepEqual(d.find('parentID.id', 2), [
    data[0], data[1]
  ])
})


test('find multiple', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
    {id:3, parentID:{id:3}, c:7}
  ]
  const d = new db(data)
  // console.log(util.inspect(d.index))

  t.deepEqual(d.find('id', [2, 20, 3]), [
    data[1], data[2]
  ])
})

test('findMany', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
    {id:3, parentID:{id:3}, c:7}
  ]
  const d = new db(data, {
    'parentID.id': {multiple: true}
  })
  // console.log(util.inspect(d.index))

  t.deepEqual(d.findMany({
    id: [1,2,3],
    'parentID.id': 3
  }), [
    data[2]
  ])

  t.deepEqual(d.findMany({
    id: [1,2],
    'parentID.id': 3
  }), [
    
  ])

})


test('findObj', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
    {id:3, parentID:{id:3}, c:7}
  ]
  const d = new db(data, {
    'parentID.id': {multiple: true}
  })
  // console.log(util.inspect(d.index))

  t.deepEqual(d.findObj([{
    id: [1,2,3],
    'parentID.id': 3
  }, {
    id: 1
  }]), [
    data[2], data[0]
  ])

})


test('delete', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
    {id:3, parentID:{id:3}, c:7}
  ]
  const d = new db(data)
  t.deepEqual(d.delete('id', 1).ok, 1)
  t.is(data[0], null)
})

test('insert', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
  ]
  const newItem = {id:3, parentID:{id:3}, c:7}
  const d = new db(data, {
    'parentID.id': {multiple: true}
  })
  t.deepEqual(d.insert(newItem), {ok:1})
  t.deepEqual(d.find('id',3), newItem)

  t.deepEqual(d.index, {
    id: {
      1:0, 2:1, 3:2
    },
    'parentID.id':{
      2: [0,1], 3: [2]
    }
  })

})


test('insert unique', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
  ]
  const newItem = {id:2, parentID:{id:3}, c:7}
  const d = new db(data)
  t.true(!!d.insert(newItem).error)
})

test('update - basic 1', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
  ]
  const newItem = {id:3, parentID:{id:3}, c:7}
  const d = new db(data, {
    'parentID.id': {multiple:1}
  })
  t.true(!!d.update('id', 2, newItem).ok)
  t.deepEqual(d.data, [
    {id:1, parentID:{id:2}, c:3}, 
    null,
    {id:3, parentID:{id:3}, c:7}
  ])
  t.is(d.find('id',2), null)
  t.deepEqual(d.find('parentID.id',2), [
    {id:1, parentID:{id:2}, c:3}
  ])
  t.deepEqual(d.index, {
    id:{
      1:0,
      2:1,
      3:2
    },
    'parentID.id':{
      2: [0,1],
      3: [2]
    }
  })
})


test('update - basic 2', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
  ]
  const newItem = {parentID:{id:3}, x:9}
  const d = new db(data, {
    'parentID.id': {multiple:1}
  })

  t.true(/cannot find/.test(d.update('id', 3, newItem).error))

  t.true(!!d.update('id', 2, newItem).ok)

  t.deepEqual(d.data, [
    {id:1, parentID:{id:2}, c:3}, 
    null,
    {id:2, parentID:{id:3}, c:6, x:9}
  ])

  // console.log(util.inspect( d.find('id',2) ))
  
  t.deepEqual(d.find('id',2), { id: 2, parentID: { id: 3 }, c: 6, x: 9 })
  
  t.deepEqual(d.find('parentID.id',2), [
    {id:1, parentID:{id:2}, c:3}
  ])
  t.deepEqual(d.index, {
    id:{
      1:0,
      2:2,
    },
    'parentID.id':{
      2: [0,1],
      3: [2]
    }
  })
})



test('update - replace/upsert', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
  ]
  const newItem = {id:2, parentID:{id:3}, x:9}
  const newItem4 = {id:4, parentID:{id:3}, x:9}
  const d = new db(data, {
    'parentID.id': {multiple:1}
  })

  const config = {upsert:1, replace:1}
  // console.log(
  //   // d.update('id', 3, newItem, config),
  //   // d.update('id', 2, newItem, config),
  //   util.inspect( d.data )
  // )


  t.true(/duplicate/.test(d.update('id', 3, newItem, config).error))
  t.true(d.update('id', 3, newItem4, config).ok==1)

  d.delete('id', 4)

  t.true(d.update('id', 2, newItem, config).ok==1)

  t.deepEqual(d.data, [
    {id:1, parentID:{id:2}, c:3}, 
    null,
    null,
    null,
    newItem
  ])

  // console.log(util.inspect( d.find('id',2) ))
  
  t.deepEqual(d.find('id',2), { id: 2, parentID: { id: 3 }, x: 9 })
  
  t.deepEqual(d.index, {
    id:{
      1:0,
      2:4,
      4:3,
    },
    'parentID.id':{
      2: [0, 1],  // 1 -> null
      3: [3, 4]
    }
  })

  t.deepEqual(d.find('parentID.id',2), [
    {id:1, parentID:{id:2}, c:3}
  ])

})

test('find perf', t=>{
  const {heapUsed} = process.memoryUsage()
  const arr = Array.from({length: 1e6}, (val,id) => ({
    id, n: Math.random()*100
  }) )
  const dd = new db(arr)
  const beginTime = +new Date
  console.time('find perf')
  for(let i=10000;i<20000;i++){
    dd.find('id', i)
  }
  console.timeEnd('find perf')
  t.true(+new Date-beginTime < 100)
  console.log('memory usage:', process.memoryUsage().heapUsed - heapUsed)
})
