"use client";
import PuntoScreen from "../punto-screen";
import { formPanel } from "../shared/form-panel";

function accountForms() {
  return formPanel(
    "Tu cuenta de VoZero",
    `<form data-form="login">
      <h2>Iniciar sesión</h2>
      <div class="form-field"><label for="login-user">Nombre de usuario</label><input id="login-user" name="username" autocomplete="username" required /></div>
      <div class="form-field"><label for="login-password">Contraseña</label><input id="login-password" name="clave" type="password" autocomplete="current-password" required /></div>
      <button class="btn btn-primary" type="submit">Ingresar</button>
    </form>
    <form data-form="register">
      <h2>Crear cuenta</h2>
      <div class="form-field"><label for="new-user">Nombre de usuario</label><input id="new-user" name="username" minlength="3" maxlength="30" pattern="[A-Za-z0-9_.]+" autocomplete="username" required /></div>
      <div class="form-field"><label for="new-email">Email</label><input id="new-email" name="email" type="email" autocomplete="email" required /></div>
      <div class="form-field"><label for="new-password">Contraseña (mínimo 8 caracteres)</label><input id="new-password" name="clave" type="password" minlength="8" maxlength="128" autocomplete="new-password" required /></div>
      <button class="btn btn-primary" type="submit">Crear cuenta</button>
    </form>`,
    true,
  );
}

export default function Screen() {
  return <PuntoScreen view="register" renderScreen={accountForms} />;
}
