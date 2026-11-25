"use client";

import PuntoScreen from "../punto-screen";
import { formPanel } from "../shared/form-panel";

function loginForm() {
  return formPanel(
    "Iniciar sesión",
    `<form class="account-form" data-form="login">
      <div class="form-field">
        <label for="login-user">Nombre de usuario</label>
        <input id="login-user" name="username" autocomplete="username" required />
      </div>
      <div class="form-field">
        <label for="login-password">Contraseña</label>
        <input id="login-password" name="clave" type="password" autocomplete="current-password" required />
      </div>
      <button class="btn btn-primary" type="submit">Ingresar</button>
    </form>
    <a class="btn btn-outline account-switch" href="/register">¿Querés crear una cuenta?</a>`,
    true,
  );
}

export default function Screen() {
  return <PuntoScreen view="login" renderScreen={loginForm} />;
}
