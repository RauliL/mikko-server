import { isFunction, upperFirst } from 'lodash';

export const dispatch = (view, type, data = {}) => {
  const el = view.el || view;

  el.dispatchEvent(new CustomEvent('party-line-event', {
    detail: { type, data },
    bubbles: true
  }));
};

export const listen = (view) => {
  const el = view.el || view;

  el.addEventListener('party-line-event', (ev) => {
    const { type, data } = ev.detail;
    const callback = view[`on${upperFirst(type)}`];

    if (isFunction(callback)) {
      callback.call(view, data);
    }
  });
};
