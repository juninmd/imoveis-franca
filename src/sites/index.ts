import c15imob from './c15imob';
import aacosta from './aacosta';
import agnelloimoveis from './agnelloimoveis';
import imoveisfranca from './imoveis-franca';
import espaconobreimoveis from './espaconobreimoveis';
import { Site } from '../types';
import imobiliariapimentafranca from './imobiliariapimentafranca';
import imoveismpb from './imoveismpb';
import mazzaimoveis from './mazzaimoveis';
import parraimobiliaria from './parraimobiliaria';
import vtiimoveis from './vtiimoveis';
import botelhoimobiliaria from './botelhoimobiliaria';
import unioconimobiliaria from './unioconimobiliaria';
import imobiliariaplano from './imobiliariaplano';
import transacaoimobiliaria from './transacaoimobiliaria';
import conectaassesconimoveis from './conectaassesconimoveis';

export const sites: Site[] = [
  c15imob, aacosta, agnelloimoveis, imoveisfranca, espaconobreimoveis,
  imobiliariapimentafranca, mazzaimoveis, parraimobiliaria, vtiimoveis,
  botelhoimobiliaria, unioconimobiliaria, imobiliariaplano,
  transacaoimobiliaria, conectaassesconimoveis,
  ...imoveismpb as unknown as Site[]
];
