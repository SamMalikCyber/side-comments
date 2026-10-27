// Listens for the keyboard shortcut (Alt+C by default) and tells the
// YouTube tab you're looking at to flip the side column.

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-side-column') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
  } catch {
    // The active tab isn't YouTube, so there's nothing to flip.
  }
});
