"""Build editable Teneth sheets from the approved FC7090U layout.

The source sheets remain the layout reference. Product values below come from
the supplied manufacturer brochures; do not infer unlisted precision figures.
"""
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1] / "src"
BASE = "teneth-fc7090u"

PRODUCTS = [
    dict(slug="teneth-fc7090a", model="FC7090A", name="Mesa de corte digital de mesa fija",
         size="700 × 900 mm", table="Mesa fija", image="teneth-fc7090a-machine.jpg",
         copy="Corte, medio corte y hendido en una mesa fija compacta con registro por cámara CCD, ideal para hojas, etiquetas y packaging liviano.",
         feature="Mesa fija", feature_desc="Superficie estable para materiales en hoja.",
         pack="169 × 132 × 119 cm", weight="330 kg", consumption="1,5 kW"),
    dict(slug="teneth-fc5070e", model="FC5070E", name="Mesa de corte digital compacta",
         size="500 × 700 mm", table="Mesa fija", image="teneth-fc5070e-machine.png",
         copy="Mesa de corte de formato compacto con cámara CCD y doble herramienta para corte, medio corte y hendido de piezas en hoja.",
         feature="Mesa fija", feature_desc="Formato compacto para trabajos en hoja.",
         pack="118 × 98,5 × 92 cm", weight="150 kg", consumption="Según configuración"),
    dict(slug="teneth-fc9012", model="FC9012", name="Mesa de corte digital con transportador",
         size="900 × 1200 mm", table="Transportadora (rollo y hoja)", image="teneth-fc9012-machine.jpg",
         copy="Mesa transportadora de 900 × 1200 mm con cámara CCD y doble herramienta para corte y hendido de etiquetas, cartón y materiales gráficos.",
         feature="Mesa transportadora", feature_desc="Para materiales en rollo y hoja.",
         pack="180 × 200 × 150 cm", weight="400 kg", consumption="Menos de 2000 W"),
    dict(slug="teneth-fc1313u", model="FC1313U", name="Mesa de corte digital de gran formato",
         size="1300 × 1300 mm", table="Transportadora (rollo y hoja)", image="teneth-fc1313u-machine.jpg",
         copy="Mesa transportadora de 1300 × 1300 mm con cámara CCD y doble herramienta para aplicaciones de gran formato, corte y hendido.",
         feature="Mesa transportadora", feature_desc="Alimentación de rollos y hojas de gran tamaño.",
         pack="250 × 200 × 150 cm", weight="500 kg", consumption="Según configuración"),
    dict(slug="teneth-tn24ccd", model="TN24CCD", name="Plotter de corte con cámara CCD",
         size="635 mm de corte", table="Alimentación de rollo y hoja", image="teneth-tn24ccd-machine.jpg",
         copy="Plotter de corte con cámara CCD para registro de contornos en etiquetas, stickers, vinilos y piezas gráficas. Alimentación flexible de rollo y hoja.",
         feed="740 mm", cut="635 mm", weight="30 kg", stand="Opcional"),
    dict(slug="teneth-tn48ccd", model="TN48CCD", name="Plotter de corte con cámara CCD",
         size="1250 mm de corte", table="Alimentación de rollo y hoja", image="teneth-tn48ccd-machine.jpg",
         copy="Plotter de corte de 1250 mm útiles con cámara CCD para trabajos de contorno en vinilos, stickers y gráfica de gran formato.",
         feed="1350 mm", cut="1250 mm", weight="38 kg", stand="Incluido"),
    dict(slug="teneth-tn59ccd", model="TN59CCD", name="Plotter de corte con cámara CCD",
         size="1550 mm de corte", table="Alimentación de rollo y hoja", image="teneth-tn59ccd-machine.jpg",
         copy="Plotter de corte de 1550 mm útiles con cámara CCD y alimentación de rollo u hoja para producción de gráfica de gran formato.",
         feed="1650 mm", cut="1550 mm", weight="45 kg", stand="Incluido"),
    dict(slug="teneth-l6hkpro", model="L6HK Pro", name="Cortadora digital automática de hojas",
         size="330 × 485 mm", table="Alimentación automática de hojas", image="teneth-l6hkpro-machine.jpg",
         copy="Cortadora digital de hojas con alimentador automático para tiradas cortas de etiquetas, packaging liviano y piezas gráficas personalizadas.",
         pack="85 × 65 × 53 cm", weight="60 kg"),
]


def escape(value):
    return html.escape(str(value), quote=False)


def replace_text(source, eid, value):
    pattern = rf'(<(?P<tag>[\w]+)\b[^>]*\bdata-eid="{re.escape(eid)}"[^>]*>)(.*?)(</(?P=tag)>)'
    result, n = re.subn(pattern, lambda m: m.group(1) + value + m.group(4), source, count=1, flags=re.S)
    if n != 1:
        raise ValueError(f"Missing text element: {eid}")
    return result


def replace_image(source, eid, filename):
    pattern = rf'(<img\b[^>]*\bdata-eid="{re.escape(eid)}"[^>]*\bsrc=")[^"]+("[^>]*>)'
    result, n = re.subn(pattern, lambda m: m.group(1) + '/assets/' + filename + m.group(2), source, count=1)
    if n != 1:
        raise ValueError(f"Missing image element: {eid}")
    return result


def specs(product):
    model = product['model']
    if model.startswith('TN'):
        return [
            ('Modelo', model), ('Tipo de equipo', 'Plotter de corte con cámara CCD'),
            ('Ancho de alimentación', product['feed']), ('Ancho máximo de corte', product['cut']),
            ('Sistema de registro', 'Cámara CCD'), ('Materiales', 'Rollo y hoja'),
            ('Velocidad de corte', 'Hasta 1000 mm/s'), ('Fuerza de corte', '10 a 1000 g'),
            ('Precisión mecánica', '0,025 mm'), ('Repetibilidad', 'Menor que 0,025 mm'),
            ('Pantalla', 'Táctil de 4,3 pulgadas'), ('Portaherramientas', 'Cuchilla intercambiable'),
            ('Aplicaciones', 'Vinilo, etiquetas, stickers y gráfica de contorno'),
            ('Soporte de piso', product['stand']), ('Peso bruto', product['weight']),
        ]
    if model == 'L6HK Pro':
        return [
            ('Modelo', model), ('Tipo de equipo', 'Cortadora digital automática de hojas'),
            ('Tamaño máximo de hoja', product['size']), ('Alimentación', 'Bandeja posterior automática'),
            ('Capacidad de bandeja', 'Hasta 100 hojas'), ('Sistema de registro', 'Cámara CCD'),
            ('Configuración de cabezales', 'Dos para corte y hendido, o uno para corte'),
            ('Velocidad de corte', 'Hasta 1500 mm/s'), ('Fuerza de corte', '10 a 1000 g'),
            ('Pantalla', 'Táctil de 4,3 pulgadas'), ('Motor', 'Servo'),
            ('Aplicaciones', 'Etiquetas, packaging liviano y piezas personalizadas'),
            ('Medidas del embalaje', product['pack']), ('Peso bruto', product['weight']),
        ]
    return [
        ('Modelo', model), ('Tipo de mesa', product['table']),
        ('Área de corte', product['size']), ('Succión', '4 áreas de succión'),
        ('Adsorción por aire', 'Vacío'), ('Sistema de registro', 'Cámara CCD'),
        ('Herramientas', 'Doble herramienta'), ('Funciones', 'Corte y hendido'),
        ('Tipos de corte', 'Corte completo, medio corte y contorno'),
        ('Velocidad de corte', 'Hasta 1000 mm/s'), ('Fuerza de corte', 'Hasta 1000 g'),
        ('Espesor máximo', '1 mm'), ('Consumo', product['consumption']),
        ('Medidas del embalaje', product['pack']), ('Peso bruto', product['weight']),
    ]


def make_sheet(product, number):
    slug, model = product['slug'], product['model']
    source = (ROOT / f'{BASE}-p{number}.html').read_text(encoding='utf-8')
    source = source.replace(BASE, slug).replace('FC7090U', model)
    source = source.replace('teneth-fc7090u.css', f'{slug}.css')
    source = replace_image(source, 'machine', product['image']) if number == 1 else source
    if number == 1:
        source = replace_text(source, 'hero-title', f'TENETH<br><em>{escape(model)}</em>')
        source = replace_text(source, 'hero-subtitle', escape(product['name']) + '<br>' + escape(product['size']))
        source = replace_text(source, 'hero-copy', escape(product['copy']))
        if model.startswith('TN'):
            feature_values = [
                ('CCD', 'Registro óptico para corte de contornos.', 'teneth-feature-camera.png'),
                ('Rollo y hoja', 'Distintas formas de alimentar el material.', 'teneth-feature-belt.png'),
                ('Cuchilla', 'Herramienta de corte intercambiable.', 'teneth-tn-tools-clean.png'),
                ('Hasta 1000 mm/s', 'Velocidad de corte para producción diaria.', 'teneth-feature-speed.png'),
                ('Pantalla táctil', 'Control desde una pantalla de 4,3 pulgadas.', 'teneth-feature-precision.png'),
            ]
        elif model == 'L6HK Pro':
            feature_values = [
                ('Alimentador', 'Bandeja automática de hasta 100 hojas.', 'teneth-feature-belt.png'),
                ('Cámara CCD', 'Registro de marcas para corte de contorno.', 'teneth-feature-camera.png'),
                ('Corte y hendido', 'Configuración de dos cabezales.', 'teneth-feature-tools.png'),
                ('Hasta 1500 mm/s', 'Velocidad de corte.', 'teneth-feature-speed.png'),
                ('330 × 485 mm', 'Tamaño máximo de hoja.', 'teneth-feature-precision.png'),
            ]
        else:
            feature_values = [
                (product['feature'], product['feature_desc'], 'teneth-feature-precision.png' if product['table'] == 'Mesa fija' else 'teneth-feature-belt.png'),
                ('Cámara CCD', 'Corte de contornos con registro óptico.', 'teneth-feature-camera.png'),
                ('Doble herramienta', 'Corte y hendido en un mismo equipo.', 'teneth-feature-tools.png'),
                ('Hasta 1000 mm/s', 'Velocidad de corte.', 'teneth-feature-speed.png'),
                ('4 zonas de succión', 'Fijación del material por vacío.', 'teneth-feature-precision.png'),
            ]
        for key, (title, body, icon) in zip(['belt','camera','tools','speed','precision'], feature_values):
            source = replace_text(source, f'feature-title-{key}', escape(title))
            source = replace_text(source, f'feature-body-{key}', escape(body))
            source = replace_image(source, f'feature-icon-{key}', icon)
        if model.startswith('TN'):
            source = replace_text(source, 'applications-intro', 'Corte de contorno para vinilos, etiquetas, stickers y materiales gráficos en rollo u hoja.')
            source = replace_text(source, 'app-title-packaging', 'Gráfica en hoja')
            source = replace_text(source, 'app-body-packaging', 'Corte de piezas impresas en hojas.')
            source = replace_text(source, 'app-body-pop', 'Corte de piezas para señalética y exhibición.')
        elif model == 'L6HK Pro':
            source = replace_text(source, 'applications-intro', 'Producción automática de piezas gráficas en hojas: etiquetas, stickers, pequeños envases y material promocional.')
        else:
            source = replace_text(source, 'applications-intro', 'Corte y hendido para etiquetas, stickers, calcomanías, packaging liviano, material POP y vinilo.')
    else:
        source = replace_text(source, 'spec-title', f'FICHA TÉCNICA<br><em>TENETH {escape(model)}</em>')
        source = replace_text(source, 'spec-intro', f'Especificaciones técnicas del equipo Teneth {escape(model)}.')
        rows = ''.join(f'<tr><th data-eid="spec-label-{i}" data-text>{escape(label)}</th><td data-eid="spec-value-{i}" data-text>{escape(value)}</td></tr>' for i, (label,value) in enumerate(specs(product),1))
        source, n = re.subn(r'(<table class="spec-table">.*?<tbody>).*?(</tbody></table>)', lambda m: m.group(1) + rows + m.group(2), source, count=1, flags=re.S)
        if n != 1: raise ValueError('Missing specification table')
        if model.startswith('TN'):
            source = replace_text(source, 'materials-title', 'MATERIALES Y USOS RECOMENDADOS')
            source = replace_text(source, 'material-title-packaging', 'Gráfica en hoja')
    (ROOT / f'{slug}-p{number}.html').write_text(source, encoding='utf-8')


def build(product):
    slug, model = product['slug'], product['model']
    for number in (1,2): make_sheet(product, number)
    preview = (ROOT / f'{BASE}.html').read_text(encoding='utf-8').replace(BASE, slug).replace('FC7090U', model)
    preview = preview.replace('Mesa de corte digital, características y aplicaciones.', product['name'] + ', características y aplicaciones.')
    (ROOT / f'{slug}.html').write_text(preview, encoding='utf-8')
    print_page = (ROOT / f'{BASE}-print.html').read_text(encoding='utf-8').replace(BASE, slug).replace('FC7090U', model)
    (ROOT / f'{slug}-print.html').write_text(print_page, encoding='utf-8')
    css = (ROOT / f'{BASE}.css').read_text(encoding='utf-8')
    # Shorter tables retain the existing bottom baseline with row heights distributed.
    css += '\n.spec-table tbody tr{height:auto}\n'
    if model == 'FC7090A':
        css += '.p1 .hero-machine{object-fit:cover;object-position:78% 50%}\n'
    css += '.p1 .orange-wedge{display:none}\n'
    if model == 'L6HK Pro': css += '.p1 .hero-title{font-size:59pt}.p2 .spec-title em{font-size:44pt}\n'
    elif len(model) > 7: css += '.p1 .hero-title{font-size:58pt}.p2 .spec-title em{font-size:45pt}\n'
    (ROOT / f'{slug}.css').write_text(css, encoding='utf-8')


def update_catalogue():
    path = ROOT / 'index.html'
    source = path.read_text(encoding='utf-8')
    anchor = '        <a class="card done" href="/teneth-fc7090u.html">'
    if anchor not in source: raise ValueError('Teneth catalogue anchor missing')
    cards = ''.join(f'        <a class="card done" href="/{p["slug"]}.html">\n          <span class="model">TENETH {escape(p["model"])}</span>\n          <span class="status">Borrador · 2 hojas editables</span>\n        </a>\n' for p in PRODUCTS)
    # Make the operation idempotent.
    for p in PRODUCTS:
        source = re.sub(rf'        <a class="card done" href="/{p["slug"]}\.html">.*?</a>\n', '', source, flags=re.S)
    source = source.replace(anchor, cards + anchor)
    path.write_text(source, encoding='utf-8')


if __name__ == '__main__':
    for product in PRODUCTS: build(product)
    update_catalogue()
    print(f'Built {len(PRODUCTS)} editable Teneth brochures')
