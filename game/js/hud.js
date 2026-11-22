// hud.js — the in-heist overlay: the alarm meter the whole game hangs on,
// the haul against the vault's target, the clock, smoke charges and the
// contextual hint line. Drawn last, above the room, in chunky readable type.

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function drawHUD(ctx, game) {
  const W = 1280;
  ctx.fillStyle = 'rgba(4, 8, 18, 0.82)';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.5)';
  ctx.fillRect(0, 46, W, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(game.level.def.name, 16, 29);

  drawAlarmMeter(ctx, game, W / 2 - 190, 10, 380, 24);

  ctx.textAlign = 'right';
  ctx.fillStyle = game.lootValue >= game.level.def.target ? '#2ee6a8' : '#f4f6fb';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText(`$${game.lootValue.toLocaleString('en-US')} / $${game.level.def.target.toLocaleString('en-US')}`, 1010, 30);
  ctx.fillStyle = '#aeb9d4';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(formatTime(game.runTime), 1095, 30);
  drawSmokeCharges(ctx, game, 1130, 14);
  ctx.textAlign = 'right';
  ctx.fillStyle = game.save.muted ? '#5f6b8a' : '#ffd166';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(game.save.muted ? 'MUTE' : 'SOUND', 1264, 30);

  if (game.hint && game.runTime < game.hint.until) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 19px system-ui, sans-serif';
    const w = ctx.measureText(game.hint.text).width + 36;
    ctx.fillStyle = 'rgba(4, 8, 18, 0.78)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - w / 2, 756, w, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText(game.hint.text, W / 2, 779);
  }
}

export function drawAlarmMeter(ctx, game, x, y, w, h) {
  const value = game.alarm / 100;
  ctx.fillStyle = '#131c30';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  const hue = value < 0.45 ? '#2ee6a8' : value < 0.75 ? '#ffb042' : '#ff4757';
  if (value > 0.01) {
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, Math.max(6, (w - 4) * value), h - 4, 4);
    ctx.fill();
  }
  ctx.strokeStyle = game.spottedNow && Math.sin(game.time * 14) > 0 ? '#ff4757' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.stroke();
  ctx.fillStyle = '#f4f6fb';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.spottedNow ? '!! SPOTTED !!' : 'ALARM', x + w / 2, y + 17);
}

function drawSmokeCharges(ctx, game, x, y) {
  for (let i = 0; i < game.level.def.smoke; i++) {
    const cx = x + i * 26;
    ctx.beginPath();
    ctx.arc(cx + 9, y + 10, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < game.smokeLeft ? '#cfd8ec' : 'rgba(120, 130, 160, 0.25)';
    ctx.fill();
    ctx.fillStyle = i < game.smokeLeft ? '#26314d' : 'rgba(120,130,160,0.4)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('S', cx + 9, y + 14);
  }
}

export function drawSpottedVignette(ctx, game) {
  if (game.alarm < 4) return;
  const a = Math.min(0.34, game.alarm / 100 * 0.4) * (game.spottedNow ? 0.75 + 0.25 * Math.sin(game.time * 14) : 1);
  const grad = ctx.createRadialGradient(640, 400, 320, 640, 400, 760);
  grad.addColorStop(0, 'rgba(255, 40, 60, 0)');
  grad.addColorStop(1, `rgba(255, 40, 60, ${a})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 800);
}
