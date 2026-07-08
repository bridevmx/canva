// CanvasPersistence.js — Cargar/guardar proyectos desde/hacia PocketBase

import { COLLECTIONS, FIELDS } from '../pb.config.js?v=2.0.0';
import { StickerItem }  from './StickerItem.js?v=2.0.0';

export class CanvasPersistence {
  constructor(editor, pb, auth) {
    Object.defineProperty(this, 'editor', { value: editor, enumerable: false, writable: true, configurable: true });
    Object.defineProperty(this, 'pb',     { value: pb,     enumerable: false, writable: true, configurable: true });
    Object.defineProperty(this, 'auth',   { value: auth,   enumerable: false, writable: true, configurable: true });
    this.savedProjects    = [];
    this.currentRecordId  = null;
    this.editingAsAdmin   = false;
  }

  async loadUserProjects() {
    if (!this.auth.user) return;
    try {
      const records = await this.pb.collection(COLLECTIONS.orders).getList(1, 40, {
        filter: `user = "${this.auth.user.id}"`,
        sort: '-created'
      });
      this.savedProjects = records.items.map(r => ({
        id: r.id,
        name: r.title || ('Borrador ' + new Date(r.created).toLocaleDateString()),
        date: r.created
      }));
    } catch (err) { console.error('Error loading projects', err); }
  }

  async loadProject(id) {
    if (!id) return;
    const record = await this.pb.collection(COLLECTIONS.orders).getOne(id);
    this.currentRecordId = id;
    this.editingAsAdmin = this.auth.isAdmin();

    this.editor.paper.setSize(record[FIELDS.orders.paperSize] || 'a4');
    this.editor.paper.pageColors = { 1: record[FIELDS.orders.pageBg] || '#ffffff' };
    this.editor.projectTitle = record.title || '';

    let source = record.canvas_data;
    if (this.editingAsAdmin) {
      const admin = record.admin_canvas_data;
      const hasAdmin = admin && (typeof admin === 'object' ? admin.items?.length : JSON.parse(admin).items?.length);
      if (hasAdmin) source = admin;
    }

    let items = [];
    if (source) {
      const parsed = typeof source === 'string' ? JSON.parse(source) : source;
      if (parsed && typeof parsed === 'object' && 'items' in parsed) {
        items = parsed.items;
        if (parsed.pageColors) this.editor.paper.pageColors = { ...parsed.pageColors };
      } else items = parsed;
    }

    items.forEach(item => {
      if (item.type === 'image' && item.src?.startsWith('FILE:')) {
        const prefix = item.src.replace('FILE:', '').split('.')[0].replace(/-/g, '_');
        let assets = [];
        if (Array.isArray(record.upload_assets)) assets = record.upload_assets;
        else if (typeof record.upload_assets === 'string' && record.upload_assets.trim()) assets = [record.upload_assets];
        const fn = assets.find(f => f.startsWith(prefix) || f.includes(prefix));
        if (fn) {
          const url = this.pb.files.getURL(record, fn);
          item.src = url;
          if (item.originalSrc) item.originalSrc = url;
        }
      }
      if (item.opacity === undefined) item.opacity = 1.0;
      if (item.locked === undefined)   item.locked = false;
      if (item.visible === undefined)  item.visible = true;
      if (item.page === undefined)     item.page = 1;
    });

    this.editor.items = items.map(d => StickerItem.fromJSON(d));
    this.editor.paper.syncFrom(this.editor.items);
    this.editor.clearSelection();
    this.editor.history.reset();
    this.editor.history.push();
  }

  async saveProject({ title, materialType, printQuantity, quote, pageBg }) {
    if (this.editor.isSaving) return;
    this.editor.isSaving = true;
    try {
      const itemsToSave = JSON.parse(JSON.stringify(this.editor.items));
      const fd = new FormData();

      if (!this.editingAsAdmin) {
        const safeTitle = (title || '').trim() || ('Proyecto ' + new Date().toLocaleDateString());
        fd.append('title', safeTitle);
        fd.append('status', 'recibido');
        fd.append('paper_size', this.editor.paper.paperSize);
        fd.append('page_bg', pageBg || '#ffffff');
        if (this.auth.user?.id) fd.append(FIELDS.orders.user, this.auth.user.id);
        fd.append('material_type', materialType);
      } else {
        fd.append('status', 'produccion');
      }

      for (const item of itemsToSave) {
        if (item.type === 'image' && item.src?.startsWith('data:image')) {
          const res = await fetch(item.src);
          const blob = await res.blob();
          const fn = `img_${item.id}.png`;
          fd.append('upload_assets', blob, fn);
          item.src = `FILE:${fn}`;
          if (item.originalSrc) item.originalSrc = `FILE:${fn}`;
        }
      }

      const savedState = {
        items: itemsToSave,
        quote: {
          quantity: printQuantity,
          total: quote.total,
          basePrice: quote.basePrice,
          discountPct: quote.pct
        },
        pageColors: this.editor.paper.pageColors
      };

      if (this.editingAsAdmin) {
        fd.append('admin_canvas_data', JSON.stringify(savedState));
        await this.pb.collection(COLLECTIONS.orders).update(this.currentRecordId, fd);
      } else {
        fd.append('canvas_data', JSON.stringify(savedState));
        if (this.currentRecordId) {
          await this.pb.collection(COLLECTIONS.orders).update(this.currentRecordId, fd);
        } else {
          const newRec = await this.pb.collection(COLLECTIONS.orders).create(fd);
          this.currentRecordId = newRec.id;
        }
      }

      await this.loadUserProjects();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    } finally {
      this.editor.isSaving = false;
    }
  }

  reset() {
    this.currentRecordId = null;
    this.editingAsAdmin = false;
  }
}