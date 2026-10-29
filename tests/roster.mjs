import assert from 'node:assert/strict';
import { rosterKey, nameMatches, parseRoster } from '../app/roster.ts';

// registration numbers (all spellings of the same number map to one key)
for (const v of ['UG00/ABCD/1002', 'ug00-abcd-1002', 'UG00 ABCD 1002', 'UG00/ABCD/l002', 'UG00/ABCD/IOO2', ' UG00/ABCD/1002 ']) assert.equal(rosterKey(v), 'UG00ABCD1002', v);
assert.notEqual(rosterKey('UG00/ABCD/1003'), 'UG00ABCD1002');

// names that should pass
assert.ok(nameMatches('Ada Nwosu', 'Ada Nwosu'));
assert.ok(nameMatches('nwosu ADA', 'Ada Nwosu'));
assert.ok(nameMatches('ADA OBI NWOSU', 'NWOSU Ada Obi'));
assert.ok(nameMatches('Fatima Ardo Bello', 'FATIMA Ardo Bello'));
assert.ok(!nameMatches('Fatima Ardo', 'FATIMA Ardo Bello'));           // two of three names is not enough
assert.ok(nameMatches("Masaud Nafisa", "MASA'UD Nafisa"));
assert.ok(nameMatches('Ibrahim Khalil Aliyu', 'IBRAHIM-KHALIL Aliyu Lawal'));
assert.ok(nameMatches('Abdulkarim Yusuf El Bashir', 'ABDULKARIM Yusuf El-Bashir'));
assert.ok(nameMatches('Abdulkarim Yusuf Bashir', 'ABDULKARIM Yusuf El-Bashir')); // 'El' dropped
assert.ok(nameMatches('Habibullah Abubaker Sani', 'HABIBULLAH Abubakar Sani')); // small slip in a long name

// names that should fail
assert.ok(!nameMatches('Ada', 'Ada Nwosu'));                            // one name only
assert.ok(!nameMatches('John Smith', 'Ada Nwosu'));
assert.ok(!nameMatches('', 'Ada Nwosu'));
assert.ok(!nameMatches('Musa Ahmed Ibrahim', 'MUSA Yakub Ibrahim'));     // classmates sharing two names
assert.ok(nameMatches('Musa Ahmed Ibrahim Extra', 'MUSA Ahmed Ibrahim'));  // one extra name allowed
assert.ok(!nameMatches('Musa Ahmed Ibrahim Extra Other', 'MUSA Ahmed Ibrahim'));

// short forms of Muhammad
assert.ok(nameMatches('Sulaiman Muhammad Muhammad', "MUHAMMAD Sulaiman Muh'd"));
assert.ok(nameMatches('Muhammad Sulaiman', "MUHAMMAD Sulaiman Muh'd"));            // written once is enough
assert.ok(nameMatches('Muhd Sulaiman Muhammad', "MUHAMMAD Sulaiman Muh'd"));
assert.ok(nameMatches('Baba Babangida Muhammad', "BABANGIDA BABA Muh'd"));
assert.ok(nameMatches('Mohammed Abubakar', "MUHAMMAD Muh'd Abubakar"));
assert.ok(nameMatches("Abdurraman Muhammad Amir", "ABDURRAMAN Muh'd Amir"));
assert.ok(!nameMatches('Muhammad Sulaiman', "ABDURRAMAN Muh'd Amir"));
assert.ok(!nameMatches('Muhammad', "MUHAMMAD Sulaiman Muh'd"));                    // still needs the other names

// parsing
const p = parseRoster('matric,name\nUG00/ABCD/1002, Ada Obi\r\nUG00/ABCD/l008\tZed Quinn\n\nUG01/ABCD/1001 Bola Ade Ken\nnonsense');
assert.equal(p.rows.length, 3);
assert.equal(p.rows[1].key, 'UG00ABCD1008');
assert.equal(p.rows[1].matric, 'UG00/ABCD/1008');
assert.equal(p.skipped, 2); // header + nonsense
assert.equal(parseRoster('UG00/ABCD/1002, A One\nUG00-ABCD-1002, B Two').duplicate, 'UG00-ABCD-1002');
console.log('roster tests passed');
