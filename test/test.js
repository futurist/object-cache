import db from '../'
import test from 'ava'
import util from 'util'

test('init', t => {
  const data = [{id:1, a:2, c:3}, {id:2, a:5, c:6}]
  const d = new db('abc', data)
  t.is(d.data, data)
  t.is(d.name, 'abc')
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

test('find', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
    {id:3, parentID:{id:3}, c:7}
  ]
  const d = new db('abc', data, {
    'parentID.id': {multiple: true}
  })
  // console.log(util.inspect(d.index))

  t.deepEqual(d.find('id', 2), data[1])
  t.deepEqual(d.find('parentID.id', 2), [
    data[0], data[1]
  ])
})


test('delete', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
    {id:3, parentID:{id:3}, c:7}
  ]
  const d = new db('abc', data)
  t.deepEqual(d.delete('id', 1), {ok:1})
  t.is(data[0], null)
})

test('insert', t => {
  const data = [
    {id:1, parentID:{id:2}, c:3}, 
    {id:2, parentID:{id:2}, c:6}, 
  ]
  const newItem = {id:3, parentID:{id:3}, c:7}
  const d = new db('abc', data, {
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
  const d = new db('abc', data)
  t.true(!!d.insert(newItem).error)
})


