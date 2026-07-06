// OrdersRepository.js — CRUD contra la colección de órdenes

import { COLLECTIONS } from '../pb.config.js';

export class OrdersRepository {
  constructor(pbInstance) {
    this.pb = pbInstance;
    this.collection = COLLECTIONS.orders;
  }

  async listMyOrders(userId, { page = 1, perPage = 40, sort = '-created' } = {}) {
    return this.pb.collection(this.collection).getList(page, perPage, {
      filter: `user = "${userId}"`,
      sort
    });
  }

  async listAdminOrders({ page = 1, perPage = 200, sort = '-created' } = {}) {
    return this.pb.collection(this.collection).getList(page, perPage, { sort });
  }

  async getById(id) { return this.pb.collection(this.collection).getOne(id); }

  async create(formData) {
    return this.pb.collection(this.collection).create(formData);
  }

  async update(id, formData) {
    return this.pb.collection(this.collection).update(id, formData);
  }

  async updateStatus(id, status) {
    return this.pb.collection(this.collection).update(id, { status });
  }

  subscribe(callback) {
    return this.pb.collection(this.collection).subscribe('*', callback);
  }

  unsubscribe() {
    return this.pb.collection(this.collection).unsubscribe('*');
  }
}