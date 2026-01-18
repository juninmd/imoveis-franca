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

export const sites: Site[] = [aacosta, agnelloimoveis, imoveisfranca, espaconobreimoveis, imobiliariapimentafranca, mazzaimoveis, parraimobiliaria, vtiimoveis, ...imoveismpb as unknown as Site[]];