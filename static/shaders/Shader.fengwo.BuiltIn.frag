varying vec2 fragUV;

uniform sampler2D intexture;
uniform vec2 ringCenter;
uniform float blurRadius;
uniform float ringRadius;
uniform float ringThickness;

float circle(in vec2 _st, in float _radius){
    vec2 dist = _st- vec2(0.5);
    return 1.-smoothstep(_radius-(_radius * blurRadius),
                         _radius+(_radius * blurRadius),
                         dot(dist,dist) * 4.0
    );
}

float ring( vec2 st, float scale, float ringThickness ) {

    float d1 = circle( st, scale );
    float d2 = circle( st, scale - ringThickness );

    return d1 * ( 1.0 - d2 );

}

void main()
{
    vec3 color = texture2D(intexture, fragUV).xyz;

    float r = ring(fragUV - ringCenter, ringRadius, ringThickness);

    gl_FragColor = vec4(color, r );
}