import lib from '../'
import test from 'ava'

test('test init', t => {
  const d = new lib('a')
  t.is(Object.prototype.toString.call(d.cache), '[object Object]')
  d.put(123, 123)
  t.is(d.name, 'a')
  t.is(d.get(123), 123)
})

