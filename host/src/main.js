import { version } from 'shared-elements';

document.getElementById('received').textContent = version;

const remote = await import('remote/widget');
document.getElementById('remote').textContent = remote.sharedElementsVersion;

window.__done = true;
