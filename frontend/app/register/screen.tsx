"use client";
import PuntoScreen from "../punto-screen";
import { formPanel } from "../shared/form-panel";
import { ico } from "../shared/presentation";

function registerModal() {
  return formPanel(
    "Crear una cuenta",
    `<p class="page-subtitle" style="margin-bottom:20px">Empezá con 0 karma. Después, cada voto que recibas suma o resta.</p><form data-form="register"><div class="form-field"><label>Nombre de usuario *</label><input name="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_.]{3,24}" required placeholder="tu.nombre" /></div><div class="form-field"><label>Email *</label><input type="email" name="email" required placeholder="tunombre@ejemplo.com"/></div><div class="hint-box">${ico("info", 16)} Registro local de demostración: la autenticación real se implementa en tu API de Python.</div><div class="modal-footer"><button class="btn btn-primary" type="submit">Crear cuenta</button></div></form>`,
    true,
  );
}

export default function Screen() {
  return <PuntoScreen view="register" renderScreen={registerModal} />;
}
