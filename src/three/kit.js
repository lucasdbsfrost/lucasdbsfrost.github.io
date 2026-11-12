import * as THREE from 'three';

/* Kit de construction : fusionne les volumes statiques d'un objet en un
   maillage par matériau (peu d'appels de rendu = fluide sur téléphone)
   et trace leurs arêtes. */
export function createKit(M) {
  var ONE = new THREE.Vector3(1, 1, 1);
  function merge(list, withNormals) {
    var n = 0, o = 0;
    list.forEach(function (g) { n += g.attributes.position.count; });
    var pos = new Float32Array(n * 3), nor = withNormals ? new Float32Array(n * 3) : null;
    list.forEach(function (g) {
      pos.set(g.attributes.position.array, o * 3);
      if (nor) nor.set(g.attributes.normal.array, o * 3);
      o += g.attributes.position.count;
    });
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (nor) out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    return out;
  }
  function Kit() { this.p = { body: [], hi: [], amber: [], alert: [] }; this.e = []; }
  Kit.prototype.add = function (geo, role, x, y, z, rot, edges) {
    var q = new THREE.Quaternion();
    if (rot) q.setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2]));
    geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, ONE));
    if (edges !== false) this.e.push(new THREE.EdgesGeometry(geo, 28));
    this.p[role].push(geo.index ? geo.toNonIndexed() : geo);
    return this;
  };
  Kit.prototype.box = function (w, h, d, role, x, y, z, rot, edges) {
    return this.add(new THREE.BoxGeometry(w, h, d), role, x, y, z, rot, edges);
  };
  Kit.prototype.cyl = function (r, h, role, x, y, z, seg, edges) {
    return this.add(new THREE.CylinderGeometry(r, r, h, seg || 32), role, x, y, z, null, edges);
  };
  Kit.prototype.ribbon = function (x1, z1, x2, z2) {
    var dx = x2 - x1, dz = z2 - z1, L = Math.sqrt(dx * dx + dz * dz);
    return this.add(new THREE.BoxGeometry(L, 0.03, 0.07), 'hi', (x1 + x2) / 2, 0.02, (z1 + z2) / 2,
      [0, Math.atan2(-dz, dx), 0], false);
  };
  Kit.prototype.build = function (parent) {
    var g = new THREE.Group(), self = this;
    Object.keys(this.p).forEach(function (role) {
      if (self.p[role].length) g.add(new THREE.Mesh(merge(self.p[role], true), M[role]));
    });
    if (this.e.length) g.add(new THREE.LineSegments(merge(this.e, false), M.edge));
    if (parent) parent.add(g);
    return g;
  };
  function inner(parent, x, z) {
    var g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); return g;
  }
  function piece(geo, mat, withEdges) {
    var m = new THREE.Mesh(geo, mat);
    if (withEdges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), M.edge));
    return m;
  }

  return { Kit: Kit, piece: piece, inner: inner };
}
